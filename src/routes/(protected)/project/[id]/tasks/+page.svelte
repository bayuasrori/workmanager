<script lang="ts">
	import { enhance } from '$app/forms';
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();

	let showCreateStatus = $state(false);
	let newStatusName = $state('');
	let kanbanKey = $state(0);
	let showCreateTask = $state(false);
	let newTaskName = $state('');
	let newTaskDescription = $state('');
	let newTaskStatusId = $state('');
	let creatingStatusId = $state('');
	let isCreatingTask = $state(false);
	let editingTaskId: string | null = $state(null);
	let editTaskName = $state('');
	let editTaskDescription = $state('');

	function confirmAndDelete() {
		if (confirm('Are you sure you want to delete this project? This will permanently delete all tasks and statuses.')) {
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/deleteProject';
			document.body.appendChild(form);
			form.submit();
		}
	}

	function dragStart(event: DragEvent, taskId: string) {
		event.dataTransfer?.setData('text/plain', taskId);
		if (event.dataTransfer) {
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
		const taskId = event.dataTransfer?.getData('text/plain');
		if (taskId) {
			// Optimistic move
			const taskToUpdate = data.tasks.find((t) => t.id === taskId);
			let oldStatusId: string | null | undefined;
			if (taskToUpdate) {
				oldStatusId = taskToUpdate.statusId;
				taskToUpdate.statusId = newStatusId;
				data.tasks = [...data.tasks];
				kanbanKey += 1;
			}

			const formData = new FormData();
			formData.append('taskId', taskId);
			formData.append('newStatusId', newStatusId);

			const response = await fetch('?/updateTaskStatus', {
				method: 'POST',
				body: formData
			});

			if (!response.ok && taskToUpdate && oldStatusId != null) {
				taskToUpdate.statusId = oldStatusId;
				data.tasks = [...data.tasks];
				kanbanKey += 1;
			}
		}
	}

	async function handleCreateStatus() {
		if (!newStatusName.trim()) return;
		
		const formData = new FormData();
		formData.append('name', newStatusName.trim());
		
		const response = await fetch('?/createStatus', {
			method: 'POST',
			body: formData
		});
		
		if (response.ok) {
			// Reload the page to get the new status
			window.location.reload();
		}
	}

	async function handleCreateTask() {
		if (!newTaskName.trim() || isCreatingTask) return;

		const statusToUse = creatingStatusId || newTaskStatusId || data.taskStatuses?.[0]?.id || '';
		const nameToSend = newTaskName.trim();
		const descToSend = newTaskDescription.trim();

		const formData = new FormData();
		formData.append('name', nameToSend);
		formData.append('description', descToSend);
		formData.append('statusId', statusToUse);
		formData.append('projectId', data.tasks[0]?.projectId || '');

		isCreatingTask = true;

		try {
			const response = await fetch('/tasks/create', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				// Reload the page to get the new task
				window.location.reload();
			}
		} catch (_) {
			// On error, do nothing - user can try again
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
			const result: any = await response.json();
			if (result?.task) {
				const idx = data.tasks.findIndex((t) => t.id === taskId);
				if (idx !== -1) {
					data.tasks[idx] = { ...data.tasks[idx], ...result.task };
					data.tasks = [...data.tasks];
				}
			}
			cancelEditTask();
		}
	}

	async function handleDeleteTask(taskId: string) {
		const prev = data.tasks;
		data.tasks = prev.filter((t) => t.id !== taskId);
		kanbanKey += 1;
		const formData = new FormData();
		formData.append('taskId', taskId);
		const res = await fetch(`/tasks/${taskId}`, { method: 'DELETE', body: formData });
		if (!res.ok) {
			data.tasks = prev; // revert
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
				<span>{data.tasks.length} tasks</span>
			</div>
			<div class="flex gap-2 mt-4">
				<button class="btn btn-primary btn-sm" onclick={() => showCreateTask = !showCreateTask}>
					Create New Task
				</button>
				<button class="btn btn-secondary btn-sm" onclick={() => showCreateStatus = !showCreateStatus}>
					Add Status Column
				</button>
				<button class="btn btn-error btn-sm" onclick={confirmAndDelete}>
					Delete Project
				</button>
			</div>
		</div>

		<KanbanBoard
			tasks={data.tasks}
			taskStatuses={data.taskStatuses}
			kanbanKey={kanbanKey}
			showCreateTask={showCreateTask}
			showCreateStatus={showCreateStatus}
			newTaskName={newTaskName}
			newTaskDescription={newTaskDescription}
			newTaskStatusId={newTaskStatusId}
			newStatusName={newStatusName}
			creatingStatusId={creatingStatusId}
			isCreatingTask={isCreatingTask}
			editingTaskId={editingTaskId}
			editTaskName={editTaskName}
			editTaskDescription={editTaskDescription}
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
			onNewStatusNameChange={(value) => newStatusName = value}
			onNewTaskNameChange={(value) => newTaskName = value}
			onNewTaskDescriptionChange={(value) => newTaskDescription = value}
			onNewTaskStatusIdChange={(value) => newTaskStatusId = value}
			onEditTaskNameChange={(value) => editTaskName = value}
			onEditTaskDescriptionChange={(value) => editTaskDescription = value}
			showInlineCreate={true}
			showTaskActions={true}
			taskLinkPrefix="/tasks"
		/>
	</div>
</div>
