<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Tasks</h1>
	<a href="/tasks/create" class="btn btn-primary mb-4">Create Task</a>
	<div class="overflow-x-auto">
		<table class="table w-full">
			<thead>
				<tr>
					<th>Name</th>
					<th>Project ID</th>
					<th>Assignee ID</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.tasks as task}
					<tr>
						<td>{task.name}</td>
						<td>{task.projectId}</td>
						<td>{task.assigneeId}</td>
						<td class="flex gap-2">
							<a href="/tasks/{task.id}" class="btn btn-sm">Edit</a>
							<form method="POST" action="?/delete&id={task.id}">
								<button class="btn btn-sm btn-error">Delete</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
