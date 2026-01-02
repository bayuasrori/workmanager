<script lang="ts">
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';
	import type { PageData } from './$types';
	import { getBoard, updateTaskStatus, createStatus, createTask, reorderStatuses, updateTask, deleteTask, deleteStatus } from './data.remote';

	const STATUS_DRAG_TYPE = 'application/task-status-id';
	const TASK_DRAG_TYPE = 'application/task-id';



	let { data }: { data: PageData } = $props();
	let board = $state(data.board);

	// Ensure slug is always a string, never null
	const boardSlug = $derived(board.slug ?? '');
	let taskStatuses = $state(data.board.taskStatuses);
	let statusDragSourceId: string | null = $state(null);
	let kanbanKey = $state(0);

	let showCreateStatus = $state(false);
	let newStatusName = $state('');
	let newTaskName = $state('');
	let newTaskDescription = $state('');
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
				board.tasks = [...board.tasks];
				kanbanKey += 1;
			}

			try {
				// Use remote function to update task status
				await updateTaskStatus({
					taskId,
					newStatusId
				});
			} catch {
				// If request failed, revert the optimistic update
				if (taskToUpdate && oldStatusId != null) {
					taskToUpdate.statusId = oldStatusId;
					board.tasks = [...board.tasks];
					kanbanKey += 1;
				}
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

		if (fromIndex === -1 || toIndex === -1) return;

		const previous = [...currentStatuses];
		const [moved] = currentStatuses.splice(fromIndex, 1);
		currentStatuses.splice(toIndex, 0, moved);

		taskStatuses = currentStatuses;

		try {
			await reorderStatuses({
				slug: boardSlug,
				orderedIds: currentStatuses.map((s) => s.id)
			});
		} catch {
			// Revert on error
			taskStatuses = previous;
		}
	}

	async function handleCreateStatus() {
		if (!newStatusName.trim()) return;

		try {
			await createStatus({
				slug: boardSlug,
				name: newStatusName.trim()
			});

			// Reload the board to get the new status
			const result = await getBoard({ slug: boardSlug });
			board = result.board;
			taskStatuses = result.board.taskStatuses;
			kanbanKey += 1;
			newStatusName = '';
			showCreateStatus = false;
		} catch {
			console.error('Failed to create status');
		}
	}

	async function handleCreateTask() {
		if (!newTaskName.trim() || isCreatingTask || !creatingStatusId) return;

		isCreatingTask = true;

		try {
			await createTask({
				slug: boardSlug,
				name: newTaskName.trim(),
				description: newTaskDescription.trim() || undefined,
				statusId: creatingStatusId
			});

			// Refresh board to get new task
			const result = await getBoard({ slug: boardSlug });
			board = result.board;
			taskStatuses = result.board.taskStatuses;
			kanbanKey += 1;
			cancelCreateTask();
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

		try {
			await updateTask({
				taskId,
				name: editTaskName.trim(),
				description: editTaskDescription.trim() || undefined
			});

			// Refresh board to get updated task
			const result = await getBoard({ slug: boardSlug });
			board = result.board;
			taskStatuses = result.board.taskStatuses;
			kanbanKey += 1;
			cancelEditTask();
		} catch (error) {
			console.error('Failed to update task', error);
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
		if (editingTaskId && !updatedTasks.some((task) => task.id === editingTaskId)) {
			cancelEditTask();
		}
		kanbanKey += 1;

		try {
			await deleteStatus({
				slug: boardSlug,
				statusId
			});

			// Refresh board after deletion
			const result = await getBoard({ slug: boardSlug });
			board = result.board;
			taskStatuses = result.board.taskStatuses;
			kanbanKey += 1;
		} catch (error) {
			console.error('Failed to delete status', error);
			// Revert on error
			taskStatuses = previousStatuses;
			board = { ...previousBoard, taskStatuses: previousStatuses, tasks: previousTasks };
			creatingStatusId = previousCreatingStatusId;
			editingTaskId = previousEditingState.id;
			editTaskName = previousEditingState.name;
			editTaskDescription = previousEditingState.description;
			kanbanKey += 1;
		}
	}
</script>

<svelte:head>
	<title>{board.name} - Public Board</title>
	<meta name="description" content={board.description || `Public board: ${board.name}`} />
</svelte:head>

<nav class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start">
		<a href="/" class="btn btn-ghost text-xl font-bold text-primary">Papanin</a>
	</div>
	<div class="navbar-end">
		<button class="btn btn-outline btn-sm" onclick={handleShare}>Share</button>
		<a href="/public-board/create" class="btn btn-accent btn-sm">Create Board</a>
	</div>
</nav>

<div class="min-h-screen bg-base-100 py-8">
	<div class="container mx-auto px-4">
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-base-content mb-2">{board.name}</h1>
			{#if board.description}
				<p class="text-base-content/70 mb-2">{board.description}</p>
			{/if}
			<div class="flex items-center gap-4 text-sm text-base-content/60">
				<span>{board.taskStatuses.length} columns</span>
				<span>•</span>
				<span>{board.tasks.length} tasks</span>
				<span>•</span>
				<span>Public board</span>
			</div>
			<div class="flex gap-2 mt-4">
				<button
					class="btn btn-secondary btn-sm"
					onclick={() => {
						showCreateStatus = !showCreateStatus;
					}}
					aria-pressed={showCreateStatus}
				>
					Add Column
				</button>
			</div>
		</div>

		{#if showCreateStatus}
			<div class="card bg-base-200 shadow-lg mb-4">
				<div class="card-body">
					<h3 class="card-title mb-4">Create New Column</h3>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={newStatusName}
							placeholder="Column name"
							class="input input-bordered flex-1"
						/>
						<button class="btn btn-primary" onclick={handleCreateStatus}>Create</button>
						<button class="btn btn-outline" onclick={() => (showCreateStatus = false)}>Cancel</button>
					</div>
				</div>
			</div>
		{/if}

		<KanbanBoard
			tasks={board.tasks}
			{taskStatuses}
			{kanbanKey}
			{showCreateStatus}
			{newTaskName}
			{newTaskDescription}
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
				const task = board.tasks.find((t) => t.id === taskId);
				if (!task) return;

				if (!confirm(`Delete task "${task.name}"? This cannot be undone.`)) return;

				const prev = board.tasks;
				board.tasks = prev.filter((t) => t.id !== taskId);
				board.tasks = [...board.tasks];
				kanbanKey += 1;

				try {
					await deleteTask(taskId);
				} catch (error) {
					console.error('Failed to delete task', error);
					board.tasks = prev;
					board.tasks = [...board.tasks];
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
			onEditTaskNameChange={(value: string) => (editTaskName = value)}
			onEditTaskDescriptionChange={(value: string) => (editTaskDescription = value)}
			showInlineCreate={true}
			showTaskActions={true}
			allowStatusDelete={true}
			taskLinkPrefix=""
		/>

		{#if !board.tasks || board.tasks.length === 0}
			<div class="text-center py-12">
				<p class="text-lg text-base-content/70 mb-4">No tasks yet</p>
				<a href="/public-board/create" class="btn btn-primary">Create a board</a>
			</div>
		{/if}

		<div class="card bg-primary text-primary-content shadow-lg mt-8">
			<div class="card-body text-center">
				<h2 class="card-title justify-center text-2xl mb-4">Share Your Board</h2>
				<p class="text-lg opacity-90 mb-6">
					Copy the link and share it with your team to collaborate on tasks.
				</p>
				<button class="btn btn-secondary btn-lg" onclick={handleShare}>Share Board</button>
			</div>
		</div>
	</div>
</div>