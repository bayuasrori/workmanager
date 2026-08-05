<script lang="ts">
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';
	import { page } from '$app/stores';
	import {
		getProjectTasks,
		updateTaskStatus,
		createStatus,
		reorderStatuses,
		deleteProject,
		deleteTaskStatus,
		createTask,
		updateTask,
		deleteTask
	} from './data.remote';

	const STATUS_DRAG_TYPE = 'application/task-status-id';
	const TASK_DRAG_TYPE = 'application/task-id';

	const projectId = $derived($page.params.id ?? '');
	const statusFilter = $derived($page.url.searchParams.get('status') || undefined);
	// Guard empty projectId (e.g. during route teardown) so we don't query a uuid column with "".
	const tasksQuery = $derived(projectId ? getProjectTasks({ projectId, statusId: statusFilter }) : null);
	const data = $derived(tasksQuery ? await tasksQuery : null);

	// Local override state for optimistic updates; null = fall back to server data
	let localProject = $state<NonNullable<typeof data>['project'] | null>(null);
	let localTaskStatuses = $state<NonNullable<typeof data>['taskStatuses'] | null>(null);
	let localTasks = $state<NonNullable<typeof data>['tasks'] | null>(null);
	let kanbanKey = $state(0);

	const project = $derived(localProject ?? data?.project ?? null);
	const taskStatuses = $derived(localTaskStatuses ?? data?.taskStatuses ?? []);
	const tasks = $derived(localTasks ?? data?.tasks ?? []);

	// Form states
	let showCreateStatus = $state(false);
	let newStatusName = $state('');
	let showCreateTask = $state(false);
	let newTaskName = $state('');
	let newTaskDescription = $state('');
	let newTaskStatusId = $state<string>('');
	let creatingStatusId = $state('');
	let statusDragSourceId: string | null = $state(null);

	// Edit task states
	let editingTaskId: string | null = $state(null);
	let editTaskName = $state('');
	let editTaskDescription = $state('');

	// Loading states
	let isCreatingTask = $state(false);

	function confirmAndDelete() {
		if (
			confirm(
				'Are you sure you want to delete this project? This will permanently delete all tasks and statuses.'
			)
		) {
			handleDeleteProject();
		}
	}

	async function handleDeleteProject() {
		try {
			if (!projectId || !project) return;
			await deleteProject({
				projectId,
				organizationId: project.organizationId ?? undefined
			});
			window.location.href = '/project';
		} catch (error) {
			console.error('Failed to delete project', error);
			alert('Gagal menghapus proyek. Silakan coba lagi.');
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
			const current = localTasks ?? data?.tasks ?? [];
			const taskIndex = current.findIndex((t) => t.id === taskId);
			let oldStatusId: string | null | undefined;
			if (taskIndex !== -1) {
				oldStatusId = current[taskIndex]?.statusId;
				const next = [...current];
				next[taskIndex] = { ...next[taskIndex], statusId: newStatusId };
				localTasks = next; // optimistic until server confirms
			}

			try {
				await updateTaskStatus({ taskId, newStatusId }).updates(
					getProjectTasks({ projectId, statusId: statusFilter })
				);
				// server is now source of truth — drop the optimistic override
				localTasks = null;
			} catch {
				// revert to pre-optimistic state
				localTasks = taskIndex !== -1 && oldStatusId != null ? current : null;
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
		localTaskStatuses = currentStatuses;
		statusDragEnd();

		try {
			if (!projectId) return;
			await reorderStatuses({
				projectId,
				orderedIds: currentStatuses.map((s) => s.id)
			});
		} catch {
			// Revert on error
			localTaskStatuses = previous;
		}
	}

	async function handleCreateStatus() {
		const trimmedName = newStatusName.trim();
		if (!trimmedName) return;

		try {
			if (!projectId) return;
			const createdStatus = await createStatus({
				projectId,
				name: trimmedName
			});

			const updatedStatuses = [...taskStatuses, createdStatus];
			updatedStatuses.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
			localTaskStatuses = updatedStatuses;
			kanbanKey += 1;
			newStatusName = '';
			showCreateStatus = false;
			statusDragSourceId = null;
		} catch (error) {
			console.error('Failed to create status', error);
			alert('Gagal membuat status. Silakan coba lagi.');
		}
	}

	async function handleCreateTask() {
		if (!newTaskName.trim() || isCreatingTask) return;

		const statusToUse = creatingStatusId || newTaskStatusId || taskStatuses?.[0]?.id || '';
		const nameToSend = newTaskName.trim();
		const descToSend = newTaskDescription.trim();

		isCreatingTask = true;

		try {
			if (!projectId) return;
			await createTask({
				projectId,
				name: nameToSend,
				description: descToSend || undefined,
				statusId: statusToUse || undefined
			}).updates(getProjectTasks({ projectId, statusId: statusFilter }));

			localTasks = null;
			localTaskStatuses = null;
			kanbanKey += 1;
			cancelCreateTask();
		} catch (error) {
			console.error('Failed to create task', error);
			alert('Gagal membuat tugas. Silakan coba lagi.');
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
			if (!projectId) return;
			await updateTask({
				taskId,
				name: editTaskName.trim(),
				description: editTaskDescription.trim() || undefined
			}).updates(getProjectTasks({ projectId, statusId: statusFilter }));

			localTasks = null;
			localTaskStatuses = null;
			kanbanKey += 1;
			cancelEditTask();
		} catch (error) {
			console.error('Failed to update task', error);
			alert('Gagal memperbarui tugas. Silakan coba lagi.');
		}
	}

	async function handleDeleteTask(taskId: string) {
		const task = tasks.find((t) => t.id === taskId);
		if (!task) return;

		if (!confirm(`Hapus tugas "${task.name}"? Ini tidak bisa dibatalkan.`)) return;

		const base = localTasks ?? data?.tasks ?? [];
		const prev = [...base];
		localTasks = prev.filter((t) => t.id !== taskId);
		kanbanKey += 1;

		try {
			await deleteTask({ taskId });
		} catch (error) {
			console.error('Failed to delete task', error);
			alert('Gagal menghapus tugas. Silakan coba lagi.');
			localTasks = prev;
			kanbanKey += 1;
		}
	}

	async function handleDeleteStatus(statusId: string) {
		const status = taskStatuses.find((s) => s.id === statusId);
		if (!status) return;

		if (!confirm(`Hapus status "${status.name}"? Tugas dengan status ini tidak akan dihapus.`))
			return;

		try {
			await deleteTaskStatus({ statusId });
			localTaskStatuses = (localTaskStatuses ?? data?.taskStatuses ?? []).filter(
				(s) => s.id !== statusId
			);
			kanbanKey += 1;
		} catch (error) {
			console.error('Failed to delete status', error);
			alert('Gagal menghapus status. Silakan coba lagi.');
		}
	}
</script>

<div class="min-h-[calc(100vh-4rem)] bg-base-100 py-8">
	<div class="container mx-auto px-4">
		<!-- Project Header -->
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-base-content mb-2">
				Tugas untuk Proyek
				<a
					href={project ? `/project/${project.id}` : '/project'}
					class="btn btn-outline btn-sm ml-2"
				>
					Lihat Info Proyek
				</a>
			</h1>
			{#if project?.description}
				<p class="text-base-content/70 mb-2">{project.description}</p>
			{/if}
			<div class="flex items-center gap-4 text-sm text-base-content/60">
				<span>Papan Proyek</span>
				<span>•</span>
				<span>{tasks.length} tugas</span>
			</div>
			<div class="flex flex-wrap gap-2 mt-4">
				<button
					class="btn btn-secondary btn-sm"
					onclick={() => (showCreateStatus = !showCreateStatus)}
				>
					Tambah Kolom Status
				</button>
				<button class="btn btn-error btn-sm" onclick={confirmAndDelete}> Hapus Proyek </button>
			</div>
		</div>

		<KanbanBoard
			{tasks}
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
			taskLinkPrefix="/tasks"
		/>
	</div>
</div>
