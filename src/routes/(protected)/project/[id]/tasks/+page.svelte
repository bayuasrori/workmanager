<script lang="ts">
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';
	import type { PageData } from './$types';

	const STATUS_DRAG_TYPE = 'application/task-status-id';
	const TASK_DRAG_TYPE = 'application/task-id';

	type ProjectTask = PageData['tasks'][number];
	type UpdateTaskResponse = {
		success?: boolean;
		task?: Partial<ProjectTask> & { id: string };
	};

	export let data: PageData;

	let showCreateStatus = false;
	let newStatusName = '';
	let kanbanKey = 0;
	let showCreateTask = false;
	let newTaskName = '';
	let newTaskDescription = '';
	let newTaskStatusId = '';
	let creatingStatusId = '';
	let statusDragSourceId: string | null = null;
	let isCreatingTask = false;
	let editingTaskId: string | null = null;
	let editTaskName = '';
	let editTaskDescription = '';
	let taskStatuses = [...data.taskStatuses];
	let tasks = [...data.tasks];

	let previousTaskStatuses = data.taskStatuses;
	let previousTasks = data.tasks;

	$: if (data.taskStatuses !== previousTaskStatuses) {
		previousTaskStatuses = data.taskStatuses;
		taskStatuses = [...data.taskStatuses];
	}

	$: if (data.tasks !== previousTasks) {
		previousTasks = data.tasks;
		tasks = [...data.tasks];
	}

	function confirmAndDelete() {
		if (
			confirm(
				'Are you sure you want to delete this project? This will permanently delete all tasks and statuses.'
			)
		) {
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/deleteProject';
			document.body.appendChild(form);
			form.submit();
		}
	}

	function hasStatusDrag(event: DragEvent) {
		const types = event.dataTransfer?.types;
		if (!types) return false;
		const candidate = types as unknown as DOMStringList & { contains?: (value: string) => boolean };
		if (typeof candidate.contains === 'function') {
			return candidate.contains(STATUS_DRAG_TYPE);
		}
		const iterable = types as unknown as Iterable<string>;
		return Array.from(iterable).includes(STATUS_DRAG_TYPE);
	}

	function dragStart(event: DragEvent, taskId: string) {
		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', taskId);
			event.dataTransfer.setData(TASK_DRAG_TYPE, taskId);
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function allowDrop(event: DragEvent) {
		event.preventDefault();
	}

	function dragEnter(event: DragEvent) {
		event.preventDefault();
	}

	async function drop(event: DragEvent, newStatusId: string) {
		event.preventDefault();
		const transfer = event.dataTransfer;
		if (transfer && hasStatusDrag(event)) {
			return;
		}
		const taskId = transfer?.getData(TASK_DRAG_TYPE) || transfer?.getData('text/plain');
		if (taskId) {
			const taskIndex = tasks.findIndex((t) => t.id === taskId);
			let oldStatusId: string | null | undefined;
			if (taskIndex !== -1) {
				oldStatusId = tasks[taskIndex]?.statusId;
				tasks[taskIndex] = { ...tasks[taskIndex], statusId: newStatusId };
				tasks = [...tasks];
				kanbanKey += 1;
			}

			const formData = new FormData();
			formData.append('taskId', taskId);
			formData.append('newStatusId', newStatusId);

			const response = await fetch('?/updateTaskStatus', {
				method: 'POST',
				body: formData
			});

			if (!response.ok && taskIndex !== -1 && oldStatusId != null) {
				tasks[taskIndex] = { ...tasks[taskIndex], statusId: oldStatusId };
				tasks = [...tasks];
				kanbanKey += 1;
			}
		}
	}

	function statusDragStart(event: DragEvent, statusId: string) {
		statusDragSourceId = statusId;
		if (event.dataTransfer) {
			event.dataTransfer.setData(STATUS_DRAG_TYPE, statusId);
			event.dataTransfer.setData('text/plain', statusId);
			event.dataTransfer.effectAllowed = 'move';
		}
		event.stopPropagation();
	}

	function statusDragEnd() {
		statusDragSourceId = null;
	}

	function statusDragOver(event: DragEvent, targetStatusId: string) {
		if (!hasStatusDrag(event)) {
			return;
		}
		if (!statusDragSourceId || statusDragSourceId === targetStatusId) {
			return;
		}
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	async function statusDrop(event: DragEvent, targetStatusId: string) {
		if (!hasStatusDrag(event)) {
			return;
		}
		event.preventDefault();
		const draggedId = event.dataTransfer?.getData(STATUS_DRAG_TYPE) || statusDragSourceId;
		if (!draggedId || draggedId === targetStatusId) {
			return;
		}
		const currentStatuses = [...taskStatuses];
		const fromIndex = currentStatuses.findIndex((status) => status.id === draggedId);
		const toIndex = currentStatuses.findIndex((status) => status.id === targetStatusId);
		if (fromIndex === -1 || toIndex === -1) {
			return;
		}
		const previous = [...currentStatuses];
		const [moved] = currentStatuses.splice(fromIndex, 1);
		currentStatuses.splice(toIndex, 0, moved);
		taskStatuses = currentStatuses;
		statusDragEnd();
		try {
			const formData = new FormData();
			formData.append('orderedIds', JSON.stringify(currentStatuses.map((status) => status.id)));
			const response = await fetch('?/reorderStatuses', {
				method: 'POST',
				body: formData
			});
			// let id = data.project.id
			// const responseTasks = await fetch(`/project/${id}/tasks/task-status`);
			// const result = await responseTasks.json();

			// taskStatuses = result;
			if (!response.ok) {
				throw new Error('Failed to persist status order');
			}
		} catch (error) {
			console.error('Failed to reorder statuses', error);
			taskStatuses = previous;
		}
	}

	async function handleCreateStatus() {
		const trimmedName = newStatusName.trim();
		if (!trimmedName) return;

		const formData = new FormData();
		formData.append('name', trimmedName);

		try {
			const response = await fetch('?/createStatus', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`Failed to create status (${response.status})`);
			}

			const result = await response.json().catch(() => null);
			const createdStatus = result?.status;
			if (createdStatus) {
				const updatedStatuses = [...taskStatuses, createdStatus];
				updatedStatuses.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
				taskStatuses = updatedStatuses;
				kanbanKey += 1;
				newStatusName = '';
				showCreateStatus = false;
				statusDragSourceId = null;
			}
		} catch (error) {
			console.error('Failed to create status', error);
		}
	}

	async function handleCreateTask() {
		if (!newTaskName.trim() || isCreatingTask) return;

		const statusToUse = creatingStatusId || newTaskStatusId || taskStatuses?.[0]?.id || '';
		const nameToSend = newTaskName.trim();
		const descToSend = newTaskDescription.trim();

		const formData = new FormData();
		formData.append('name', nameToSend);
		formData.append('description', descToSend);
		formData.append('statusId', statusToUse);
		const projectId = data.project?.id ?? tasks[0]?.projectId ?? '';
		formData.append('projectId', projectId);

		isCreatingTask = true;

		try {
			const response = await fetch('/tasks/create', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				window.location.reload();
			}
		} catch (error) {
			console.error('Failed to create task', error);
		} finally {
			isCreatingTask = false;
		}
	}

	function startCreateTaskForStatus(statusId: string) {
		creatingStatusId = statusId;
		newTaskName = '';
		newTaskDescription = '';
	}

	function cancelCreateTask() {
		creatingStatusId = '';
		newTaskName = '';
		newTaskDescription = '';
	}

	function startEditTask(taskId: string, name: string, description: string | null) {
		editingTaskId = taskId;
		editTaskName = name;
		editTaskDescription = description || '';
	}

	function cancelEditTask() {
		editingTaskId = null;
		editTaskName = '';
		editTaskDescription = '';
	}

	async function handleUpdateTask(taskId: string) {
		if (!editTaskName.trim()) return;
		const formData = new FormData();
		formData.append('taskId', taskId);
		formData.append('name', editTaskName.trim());
		formData.append('description', editTaskDescription.trim());
		const response = await fetch(`/tasks/${taskId}`, {
			method: 'POST',
			body: formData
		});
		if (response.ok) {
			const result = (await response.json()) as UpdateTaskResponse;
			if (result?.task) {
				const idx = tasks.findIndex((t) => t.id === taskId);
				if (idx !== -1) {
					tasks[idx] = { ...tasks[idx], ...result.task };
					tasks = [...tasks];
				}
			}
			cancelEditTask();
		}
	}

	async function handleDeleteTask(taskId: string) {
		const prev = tasks;
		tasks = prev.filter((t) => t.id !== taskId);
		kanbanKey += 1;
		const formData = new FormData();
		formData.append('taskId', taskId);
		const res = await fetch(`/tasks/${taskId}`, { method: 'DELETE', body: formData });
		if (!res.ok) {
			tasks = prev;
			kanbanKey += 1;
		}
	}
</script>

<div class="min-h-screen bg-base-100 py-8">
	<div class="container mx-auto px-4">
		<!-- Project Header -->
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-base-content mb-2">Tasks for Project</h1>
			{#if data.project?.description}
				<p class="text-base-content/70 mb-2">{data.project.description}</p>
			{/if}
			<div class="flex items-center gap-4 text-sm text-base-content/60">
				<span>Project Board</span>
				<span>•</span>
				<span>{tasks.length} tasks</span>
			</div>
			<div class="flex gap-2 mt-4">
				<button class="btn btn-primary btn-sm" onclick={() => (showCreateTask = !showCreateTask)}>
					Create New Task
				</button>
				<button
					class="btn btn-secondary btn-sm"
					onclick={() => (showCreateStatus = !showCreateStatus)}
				>
					Add Status Column
				</button>
				<button class="btn btn-error btn-sm" onclick={confirmAndDelete}> Delete Project </button>
			</div>
		</div>

		<KanbanBoard
			tasks={tasks}
			{taskStatuses}
			{kanbanKey}
			{showCreateTask}
			{showCreateStatus}
			{newTaskName}
			{newTaskDescription}
			{newTaskStatusId}
			{newStatusName}
			{creatingStatusId}
			{isCreatingTask}
			{editingTaskId}
			{editTaskName}
			{editTaskDescription}
			onCreateTask={handleCreateTask}
			onCreateStatus={handleCreateStatus}
			onStartCreateTaskForStatus={startCreateTaskForStatus}
			onCancelCreateTask={cancelCreateTask}
			onStartEditTask={startEditTask}
			onCancelEditTask={cancelEditTask}
			onUpdateTask={handleUpdateTask}
			onDeleteTask={handleDeleteTask}
			onDragStart={dragStart}
			onDrop={drop}
			onAllowDrop={allowDrop}
			onDragEnter={dragEnter}
			onStatusDragStart={statusDragStart}
			onStatusDragEnd={statusDragEnd}
			onStatusDragOver={statusDragOver}
			onStatusDrop={statusDrop}
			onNewStatusNameChange={(value) => (newStatusName = value)}
			onNewTaskNameChange={(value) => (newTaskName = value)}
			onNewTaskDescriptionChange={(value) => (newTaskDescription = value)}
			onNewTaskStatusIdChange={(value) => (newTaskStatusId = value)}
			onEditTaskNameChange={(value) => (editTaskName = value)}
			onEditTaskDescriptionChange={(value) => (editTaskDescription = value)}
			showInlineCreate={true}
			showTaskActions={true}
			taskLinkPrefix="/tasks"
		/>
	</div>
</div>
