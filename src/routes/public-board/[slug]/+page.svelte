<script lang="ts">
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';
	import type { PageData } from './$types';

	const STATUS_DRAG_TYPE = 'application/task-status-id';
	const TASK_DRAG_TYPE = 'application/task-id';

	type Board = PageData['board'];
	type BoardTask = Board['tasks'][number];
	type UpdateTaskResponse = {
		success?: boolean;
		task?: Partial<BoardTask> & { id: string };
	};

	let { data }: { data: PageData } = $props();
	let board = $state(data.board);
	let taskStatuses = $state(data.board.taskStatuses);
	let statusDragSourceId: string | null = $state(null);
	let kanbanKey = $state(0);

	// Removed sync effect to avoid unnecessary re-renders

	let showCreateStatus = $state(false);
	let newStatusName = $state('');
	let showCreateTask = $state(false);
	let newTaskName = $state('');
	let newTaskDescription = $state('');
	let newTaskStatusId = $state('');
	let creatingStatusId = $state('');
	let editingTaskId: string | null = $state(null);
	let editTaskName = $state('');
	let editTaskDescription = $state('');
	let isCreatingTask = $state(false);

	function handleShare() {
		if (navigator.share) {
			navigator.share({
				url: window.location.href,
				title: board.name
			});
		} else {
			// Fallback: copy to clipboard
			navigator.clipboard.writeText(window.location.href);
			alert('Link copied to clipboard!');
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
			// Optimistically update the task status
			const taskToUpdate = board.tasks.find((t) => t.id === taskId);
			let oldStatusId: string | null | undefined;
			if (taskToUpdate) {
				oldStatusId = taskToUpdate.statusId;
				taskToUpdate.statusId = newStatusId;
				board.tasks = [...board.tasks]; // Trigger Svelte reactivity
				kanbanKey += 1; // Force re-render of the Kanban grid
			}

			// Make the request in the background
			const formData = new FormData();
			formData.append('taskId', taskId);
			formData.append('newStatusId', newStatusId);

			const response = await fetch('?/updateTaskStatus', {
				method: 'POST',
				body: formData
			});

			// If request failed, revert the optimistic update
			if (!response.ok && taskToUpdate && oldStatusId != null) {
				taskToUpdate.statusId = oldStatusId;
				board.tasks = [...board.tasks];
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
		board = { ...board, taskStatuses: currentStatuses };
		statusDragEnd();
		try {
			const formData = new FormData();
			formData.append('orderedIds', JSON.stringify(currentStatuses.map((status) => status.id)));
			const response = await fetch('?/reorderStatuses', {
				method: 'POST',
				body: formData
			});
			if (!response.ok) {
				throw new Error('Failed to persist status order');
			}
		} catch (error) {
			console.error('Failed to reorder statuses', error);
			taskStatuses = previous;
			board = { ...board, taskStatuses: previous };
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

		// Determine status to use (column or dropdown), fallback to first status
		const statusToUse = creatingStatusId || newTaskStatusId || taskStatuses?.[0]?.id || '';

		// Capture values before clearing
		const nameToSend = newTaskName.trim();
		const descToSend = newTaskDescription.trim();

		// Use form action to create task
		const formData = new FormData();
		formData.append('name', nameToSend);
		formData.append('description', descToSend);
		formData.append('statusId', statusToUse);

		isCreatingTask = true;

		try {
			const response = await fetch('?/createTask', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const slug = board.slug;
				const responseTasks = await fetch(`/public-board/${slug}/tasks`);
				const result: Board = await responseTasks.json();

				board = result;
				taskStatuses = result.taskStatuses;
				kanbanKey += 1;
				// Clear form now that request succeeded
				cancelCreateTask();
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
		const response = await fetch('?/updateTask', {
			method: 'POST',
			body: formData
		});
		if (response.ok) {
			const result = (await response.json()) as UpdateTaskResponse;
			if (result?.task) {
				const idx = board.tasks.findIndex((t) => t.id === taskId);
				if (idx !== -1) {
					board.tasks[idx] = { ...board.tasks[idx], ...result.task };
					board.tasks = [...board.tasks];
				}
			}
			cancelEditTask();
		}
	}

	async function handleDeleteStatus(statusId: string) {
		const status = taskStatuses.find((s) => s.id === statusId);
		if (!status) return;
		const tasksInStatus = board.tasks.filter((task) => task.statusId === statusId);
		const taskCount = tasksInStatus.length;
		const baseMessage = `Delete status "${status.name}"`;
		const confirmMessage =
			taskCount > 0
				? `${baseMessage} and ${taskCount} task${taskCount === 1 ? '' : 's'}? This cannot be undone.`
				: `${baseMessage}? This cannot be undone.`;
		if (!confirm(confirmMessage)) return;

		const previousStatuses = taskStatuses;
		const previousTasks = board.tasks;
		const previousBoard = board;
		const previousCreatingStatusId = creatingStatusId;
		const previousNewTaskStatusId = newTaskStatusId;
		const previousEditingState = {
			id: editingTaskId,
			name: editTaskName,
			description: editTaskDescription
		};

		const updatedStatuses = previousStatuses.filter((s) => s.id !== statusId);
		const updatedTasks = previousTasks.filter((task) => task.statusId !== statusId);

		taskStatuses = updatedStatuses;
		board = { ...board, taskStatuses: updatedStatuses, tasks: updatedTasks };
		if (creatingStatusId === statusId) {
			creatingStatusId = '';
		}
		if (newTaskStatusId === statusId) {
			newTaskStatusId = '';
		}
		if (editingTaskId && !updatedTasks.some((task) => task.id === editingTaskId)) {
			cancelEditTask();
		}
		kanbanKey += 1;

		const formData = new FormData();
		formData.append('statusId', statusId);
		const response = await fetch('?/deleteStatus', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			try {
				const slug = board.slug;
				const refreshed = await fetch(`/public-board/${slug}/tasks`);
				if (refreshed.ok) {
					const result: Board = await refreshed.json();
					board = result;
					taskStatuses = result.taskStatuses;
					kanbanKey += 1;
				}
			} catch (error) {
				console.error('Failed to refresh board after deleting status', error);
			}
			return;
		}

		taskStatuses = previousStatuses;
		board = { ...previousBoard, taskStatuses: previousStatuses, tasks: previousTasks };
		creatingStatusId = previousCreatingStatusId;
		newTaskStatusId = previousNewTaskStatusId;
		editingTaskId = previousEditingState.id;
		editTaskName = previousEditingState.name;
		editTaskDescription = previousEditingState.description;
		kanbanKey += 1;
	}
</script>

<svelte:head>
	<title>{board.name} - Public Board</title>
	<meta name="description" content={board.description || `Public board: ${board.name}`} />
</svelte:head>

<!-- Navigation -->
<nav class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start">
		<a href="/" class="btn btn-ghost text-xl font-bold text-primary">Papanin</a>
	</div>
	<div class="navbar-end">
		<button class="btn btn-outline btn-sm" onclick={handleShare}> Share </button>
		<a href="/public-board/create" class="btn btn-accent btn-sm">Create Board</a>
	</div>
</nav>

<div class="min-h-screen bg-base-100 py-8">
	<div class="container mx-auto px-4">
		<!-- Board Header -->
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-base-content mb-2">{board.name}</h1>
			{#if board.description}
				<p class="text-base-content/70 mb-2">{board.description}</p>
			{/if}
			<div class="flex items-center gap-4 text-sm text-base-content/60">
				<span>Public Board</span>
				<span>•</span>
				<span>{board.tasks.length} tasks</span>
			</div>
			<div class="flex gap-2 mt-4">
				<button
					class="btn btn-secondary btn-sm"
					onclick={() => (showCreateStatus = !showCreateStatus)}
				>
					Add Status Column
				</button>
			</div>
		</div>

		{#if showCreateTask}
			<div class="card bg-base-200 shadow-lg mb-4">
				<div class="card-body">
					<h3 class="card-title mb-4">Create New Task</h3>
					<div class="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
						<input
							type="text"
							placeholder="Task name"
							class="input input-bordered md:col-span-2"
							bind:value={newTaskName}
							disabled={isCreatingTask}
							onkeydown={(e) => e.key === 'Enter' && !isCreatingTask && handleCreateTask()}
						/>
						<input
							type="text"
							placeholder="Description (optional)"
							class="input input-bordered md:col-span-3"
							bind:value={newTaskDescription}
							disabled={isCreatingTask}
							onkeydown={(e) => e.key === 'Enter' && !isCreatingTask && handleCreateTask()}
						/>
						<select
							class="select select-bordered md:col-span-1"
							bind:value={newTaskStatusId}
							disabled={isCreatingTask}
						>
							<option value="">Select status (optional)</option>
							{#each taskStatuses as s (s.id)}
								<option value={s.id}>{s.name}</option>
							{/each}
						</select>
					</div>
					<div class="flex gap-2 mt-3">
						<button class="btn btn-primary" onclick={handleCreateTask} disabled={isCreatingTask}>
							{#if isCreatingTask}
								<span class="loading loading-spinner loading-sm"></span>
								Creating...
							{:else}
								Create
							{/if}
						</button>
						<button
							class="btn btn-outline"
							onclick={() => (showCreateTask = false)}
							disabled={isCreatingTask}>Cancel</button
						>
					</div>
				</div>
			</div>
		{/if}

		{#if showCreateStatus}
			<div class="card bg-base-200 shadow-lg mb-4">
				<div class="card-body">
					<h3 class="card-title mb-4">Create New Status</h3>
					<div class="flex gap-2">
						<input
							type="text"
							placeholder="Status name"
							class="input input-bordered flex-1"
							bind:value={newStatusName}
							onkeydown={(e) => e.key === 'Enter' && handleCreateStatus()}
						/>
						<button class="btn btn-primary" onclick={handleCreateStatus}> Create </button>
						<button class="btn btn-outline" onclick={() => (showCreateStatus = false)}>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{/if}

		<KanbanBoard
			tasks={board.tasks}
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
			onDeleteTask={async (taskId: string) => {
				const prev = board.tasks;
				board.tasks = prev.filter((t) => t.id !== taskId);
				kanbanKey += 1;
				const formData = new FormData();
				formData.append('taskId', taskId);
				const res = await fetch('?/deleteTask', { method: 'POST', body: formData });
				if (!res.ok) {
					board.tasks = prev; // revert
					kanbanKey += 1;
				}
			}}
			onDeleteStatus={handleDeleteStatus}
			onDragStart={dragStart}
			onDrop={drop}
			onAllowDrop={allowDrop}
			onDragEnter={dragEnter}
			onStatusDragStart={statusDragStart}
			onStatusDragEnd={statusDragEnd}
			onStatusDragOver={statusDragOver}
			onStatusDrop={statusDrop}
			onNewStatusNameChange={(value: string) => (newStatusName = value)}
			onNewTaskNameChange={(value: string) => (newTaskName = value)}
			onNewTaskDescriptionChange={(value: string) => (newTaskDescription = value)}
			onNewTaskStatusIdChange={(value: string) => (newTaskStatusId = value)}
			onEditTaskNameChange={(value: string) => (editTaskName = value)}
			onEditTaskDescriptionChange={(value: string) => (editTaskDescription = value)}
			showInlineCreate={true}
			showTaskActions={true}
			allowStatusDelete={true}
			taskLinkPrefix=""
		/>

		{#if !board.tasks || board.tasks.length === 0}
			<div class="text-center py-12">
				<p class="text-lg text-base-content/70 mb-4">No tasks found for this board.</p>
				<a href="/public-board/create" class="btn btn-primary">Create Your Own Board</a>
			</div>
		{/if}

		<!-- Call to Action -->
		<div class="card bg-primary text-primary-content shadow-lg mt-8">
			<div class="card-body text-center">
				<h2 class="card-title justify-center text-2xl mb-4">Want to create your own board?</h2>
				<p class="text-lg opacity-90 mb-6">
					Create a public board for free and start collaborating with your community.
				</p>
				<a href="/public-board/create" class="btn btn-secondary btn-lg">Create Your Board</a>
			</div>
		</div>
	</div>
</div>
