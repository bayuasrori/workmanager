<script lang="ts">
	import type { TaskStatus } from '$lib/server/db/schema';

	interface TaskWithAssignee {
		id: string;
		name: string;
		description: string | null;
		projectId: string | null;
		assigneeId: string | null;
		statusId: string | null;
		startDate: Date | null;
		endDate: Date | null;
		assignee?: { username: string } | null;
		status?: { name: string } | null;
	}

	interface Props {
		tasks: TaskWithAssignee[];
		taskStatuses: TaskStatus[];
		kanbanKey: number;
		showCreateTask?: boolean;
		showCreateStatus?: boolean;
		newTaskName?: string;
		newTaskDescription?: string;
		newTaskStatusId?: string;
		newStatusName?: string;
		creatingStatusId?: string;
		isCreatingTask?: boolean;
		editingTaskId?: string | null;
		editTaskName?: string;
		editTaskDescription?: string;
		onCreateTask?: () => void;
		onCreateStatus?: () => void;
		onStartCreateTaskForStatus?: (statusId: string) => void;
		onCancelCreateTask?: () => void;
		onStartEditTask?: (taskId: string, name: string, description: string | null) => void;
		onCancelEditTask?: () => void;
		onUpdateTask?: (taskId: string) => void;
		onDeleteTask?: (taskId: string) => void;
		onDragStart?: (event: DragEvent, taskId: string) => void;
		onDrop?: (event: DragEvent, newStatusId: string) => void;
		onAllowDrop?: (event: DragEvent) => void;
		onDragEnter?: (event: DragEvent) => void;
		onNewStatusNameChange?: (value: string) => void;
		onNewTaskNameChange?: (value: string) => void;
		onNewTaskDescriptionChange?: (value: string) => void;
		onNewTaskStatusIdChange?: (value: string) => void;
		onEditTaskNameChange?: (value: string) => void;
		onEditTaskDescriptionChange?: (value: string) => void;
		showInlineCreate?: boolean;
		showTaskActions?: boolean;
		taskLinkPrefix?: string;
	}

	let {
		tasks = [],
		taskStatuses = [],
		kanbanKey = 0,
		showCreateTask = false,
		showCreateStatus = false,
		newTaskName = '',
		newTaskDescription = '',
		newTaskStatusId = '',
		newStatusName = '',
		creatingStatusId = '',
		isCreatingTask = false,
		editingTaskId = null,
		editTaskName = '',
		editTaskDescription = '',
		onCreateTask = () => {},
		onCreateStatus = () => {},
		onStartCreateTaskForStatus = () => {},
		onCancelCreateTask = () => {},
		onStartEditTask = () => {},
		onCancelEditTask = () => {},
		onUpdateTask = () => {},
		onDeleteTask = () => {},
		onDragStart = () => {},
		onDrop = () => {},
		onAllowDrop = () => {},
		onDragEnter = () => {},
		onNewStatusNameChange = () => {},
		onNewTaskNameChange = () => {},
		onNewTaskDescriptionChange = () => {},
		onNewTaskStatusIdChange = () => {},
		onEditTaskNameChange = () => {},
		onEditTaskDescriptionChange = () => {},
		showInlineCreate = true,
		showTaskActions = true,
		taskLinkPrefix = '/tasks'
	}: Props = $props();
</script>

{#if showCreateStatus}
	<div class="card bg-base-200 shadow-lg mb-4">
		<div class="card-body">
			<h3 class="card-title mb-4">Create New Status</h3>
			<div class="flex gap-2">
				<input
					type="text"
					placeholder="Status name"
					class="input input-bordered flex-1"
					value={newStatusName}
					oninput={(e) => onNewStatusNameChange((e.target as HTMLInputElement).value)}
					onkeydown={(e) => e.key === 'Enter' && onCreateStatus()}
				/>
				<button class="btn btn-primary" onclick={onCreateStatus}>
					Create
				</button>
				<button class="btn btn-outline" onclick={() => showCreateStatus = false}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showCreateTask}
	<div class="card bg-base-200 shadow-lg mb-4">
		<div class="card-body">
			<h3 class="card-title mb-4">Create New Task</h3>
			<div class="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
				<input
					type="text"
					placeholder="Task name"
					class="input input-bordered md:col-span-2"
					value={newTaskName}
					disabled={isCreatingTask}
					oninput={(e) => onNewTaskNameChange((e.target as HTMLInputElement).value)}
					onkeydown={(e) => e.key === 'Enter' && !isCreatingTask && onCreateTask()}
				/>
				<input
					type="text"
					placeholder="Description (optional)"
					class="input input-bordered md:col-span-3"
					value={newTaskDescription}
					disabled={isCreatingTask}
					oninput={(e) => onNewTaskDescriptionChange((e.target as HTMLInputElement).value)}
					onkeydown={(e) => e.key === 'Enter' && !isCreatingTask && onCreateTask()}
				/>
				<select 
					class="select select-bordered md:col-span-1" 
					value={newTaskStatusId}
					disabled={isCreatingTask}
					onchange={(e) => onNewTaskStatusIdChange((e.target as HTMLSelectElement).value)}
				>
					<option value="">Select status (optional)</option>
					{#each taskStatuses as s}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex gap-2 mt-3">
				<button class="btn btn-primary" onclick={onCreateTask} disabled={isCreatingTask}>
					{#if isCreatingTask}
						<span class="loading loading-spinner loading-sm"></span>
						Creating...
					{:else}
						Create
					{/if}
				</button>
				<button class="btn btn-outline" onclick={() => showCreateTask = false} disabled={isCreatingTask}>Cancel</button>
			</div>
		</div>
	</div>
{/if}

<!-- Kanban Board -->
{#key kanbanKey}
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
	{#each taskStatuses as status (status.id)}
		<div
			class="card bg-base-200 shadow-xl"
			ondragover={onAllowDrop}
			ondragenter={onDragEnter}
			ondrop={(event) => onDrop(event, status.id)}
			role="group"
			aria-labelledby="status-{status.id}"
		>
			<div class="card-body">
				<div class="flex items-center justify-between gap-2">
					<h2 class="card-title" id="status-{status.id}">{status.name}</h2>
					{#if showInlineCreate}
						<button class="btn btn-xs btn-primary" onclick={() => onStartCreateTaskForStatus(status.id)}>
							Add Task
						</button>
					{/if}
				</div>
				{#if creatingStatusId === status.id}
					<div class="space-y-2 mb-2">
						<input
							type="text"
							placeholder="Task name"
							class="input input-bordered w-full"
							value={newTaskName}
							disabled={isCreatingTask}
							oninput={(e) => onNewTaskNameChange((e.target as HTMLInputElement).value)}
							onkeydown={(e) => e.key === 'Enter' && !isCreatingTask && onCreateTask()}
						/>
						<input
							type="text"
							placeholder="Description (optional)"
							class="input input-bordered w-full"
							value={newTaskDescription}
							disabled={isCreatingTask}
							oninput={(e) => onNewTaskDescriptionChange((e.target as HTMLInputElement).value)}
							onkeydown={(e) => e.key === 'Enter' && !isCreatingTask && onCreateTask()}
						/>
						<div class="flex gap-2">
							<button class="btn btn-primary btn-sm" onclick={onCreateTask} disabled={isCreatingTask}>
								{#if isCreatingTask}
									<span class="loading loading-spinner loading-xs"></span>
									Creating...
								{:else}
									Create
								{/if}
							</button>
							<button class="btn btn-outline btn-sm" onclick={onCancelCreateTask} disabled={isCreatingTask}>Cancel</button>
						</div>
					</div>
				{/if}
				{#if tasks && tasks.filter((task) => task.statusId === status.id).length > 0}
					<ul class="space-y-2">
						{#each tasks.filter((task) => task.statusId === status.id) as task (task.id)}
							<li
								class="border p-2 rounded-md bg-base-100"
								draggable="true"
								ondragstart={(event) => onDragStart(event, task.id)}
							>
								{#if editingTaskId === task.id}
									<input
										type="text"
										class="input input-bordered w-full mb-2"
										value={editTaskName}
										oninput={(e) => onEditTaskNameChange((e.target as HTMLInputElement).value)}
										onkeydown={(e) => e.key === 'Enter' && onUpdateTask(task.id)}
									/>
									<input
										type="text"
										class="input input-bordered w-full mb-2"
										value={editTaskDescription}
										oninput={(e) => onEditTaskDescriptionChange((e.target as HTMLInputElement).value)}
										onkeydown={(e) => e.key === 'Enter' && onUpdateTask(task.id)}
									/>
									<div class="flex gap-2">
										<button class="btn btn-primary btn-xs" onclick={() => onUpdateTask(task.id)}>Save</button>
										<button class="btn btn-outline btn-xs" onclick={onCancelEditTask}>Cancel</button>
									</div>
								{:else}
									<div class="flex items-start justify-between gap-2">
										<h3 class="font-semibold">{task.name}</h3>
										{#if showTaskActions}
											<div class="flex items-center gap-1">
												<button class="btn btn-ghost btn-xs" title="Edit task" onclick={() => onStartEditTask(task.id, task.name, task.description)}>
													Edit
												</button>
												<button class="btn btn-ghost btn-xs text-error" title="Delete task" onclick={async () => {
													if (!confirm('Delete this task? This cannot be undone.')) return;
													onDeleteTask(task.id);
												}}>
													✕
												</button>
											</div>
										{/if}
									</div>
									{#if task.description}
										<p class="text-sm text-base-content/70 mt-1">{task.description}</p>
									{/if}
									<p class="text-sm text-gray-500">
										{#if task.assignee}
											Assigned to {task.assignee.username}
										{:else}
											Unassigned
										{/if}
									</p>
									{#if taskLinkPrefix}
										<a href="{taskLinkPrefix}/{task.id}" class="btn btn-sm btn-info mt-2">View Task</a>
									{/if}
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-base-content/50">No tasks in this status.</p>
				{/if}
			</div>
		</div>
	{/each}
</div>
{/key}

{#if !tasks || tasks.length === 0}
	<div class="text-center py-12">
		<p class="text-lg text-base-content/70 mb-4">No tasks found for this project.</p>
	</div>
{/if}
