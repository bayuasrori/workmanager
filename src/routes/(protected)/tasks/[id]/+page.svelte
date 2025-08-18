<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	{#if data.task}
		<h1 class="text-2xl font-bold mb-4">Edit Task: {data.task.name}</h1>
		<form method="POST" action="?/updateTask" class="space-y-4">
			<div>
				<label class="label" for="taskName">
					<span class="label-text">Name</span>
				</label>
				<input
					type="text"
					name="name"
					id="taskName"
					value={data.task.name}
					class="input input-bordered w-full"
				/>
			</div>
			<div>
				<label class="label" for="projectId">
					<span class="label-text">Project</span>
				</label>
				<select name="projectId" id="projectId" class="select select-bordered w-full">
					{#each data.projects as project (project.id)}
						<option value={project.id} selected={project.id === data.task.projectId}
							>{project.name}</option
						>
					{/each}
				</select>
			</div>
			<div>
				<label class="label" for="assigneeId">
					<span class="label-text">Assignee</span>
				</label>
				<select name="assigneeId" id="assigneeId" class="select select-bordered w-full">
					{#each data.users as user (user.id)}
						<option value={user.id} selected={user.id === data.task.assigneeId}
							>{user.username}</option
						>
					{/each}
				</select>
			</div>
			<div>
				<label class="label" for="statusId">
					<span class="label-text">Status</span>
				</label>
				<select name="statusId" id="statusId" class="select select-bordered w-full">
					{#each data.taskStatuses as status (status.id)}
						<option value={status.id} selected={status.id === data.task.statusId}
							>{status.name}</option
						>
					{/each}
				</select>
			</div>
			<button type="submit" class="btn btn-primary">Update Task</button>
		</form>
	{/if}
</div>
