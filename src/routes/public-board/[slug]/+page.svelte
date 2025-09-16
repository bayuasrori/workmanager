
<script lang="ts">
	import { page } from '$app/state';
	import { get } from 'svelte/store';
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';
	import type { PageData } from './$types';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { load } from './data.remote';

	let { data }: { data: PageData } = $props();
	let board = $state(data.board);
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
		const statusToUse = creatingStatusId || newTaskStatusId || board.taskStatuses?.[0]?.id || '';

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
				const result = await responseTasks.json();

				board = result;
				kanbanKey += 1;
				// Clear form now that request succeeded
				cancelCreateTask();
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
		const response = await fetch('?/updateTask', {
			method: 'POST',
			body: formData
		});
		if (response.ok) {
			const result: any = await response.json();
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
</script>

<svelte:head>
	<title>{board.name} - Public Board</title>
	<meta name="description" content={board.description || `Public board: ${board.name}`} />
</svelte:head>

<!-- Navigation -->
<nav class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start">
		<a href="/" class="btn btn-ghost text-xl font-bold text-primary">WorkManager</a>
	</div>
	<div class="navbar-end">
		<button class="btn btn-outline btn-sm" onclick={handleShare}>
			Share
		</button>
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
			<button class="btn btn-secondary btn-sm" onclick={() => showCreateStatus = !showCreateStatus}>
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
					<select class="select select-bordered md:col-span-1" bind:value={newTaskStatusId} disabled={isCreatingTask}>
						<option value="">Select status (optional)</option>
						{#each board.taskStatuses as s}
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
					<button class="btn btn-outline" onclick={() => (showCreateTask = false)} disabled={isCreatingTask}>Cancel</button>
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
					<button class="btn btn-primary" onclick={handleCreateStatus}>
						Create
					</button>
					<button class="btn btn-outline" onclick={() => showCreateStatus = false}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

		<KanbanBoard
			tasks={board.tasks}
			taskStatuses={board.taskStatuses}
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
			onDeleteTask={async (taskId) => {
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
