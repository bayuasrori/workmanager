<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Task Statuses</h1>
	<a href="/task-status/create" class="btn btn-primary mb-4">Create New Task Status</a>

	{#if data.taskStatuses && data.taskStatuses.length > 0}
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead>
					<tr>
						<th>Name</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.taskStatuses as status (status.id)}
						<tr>
							<td>{status.name}</td>
							<td>
								<a href="/task-status/{status.id}" class="btn btn-sm btn-info mr-2">Edit</a>
								<form method="POST" action="?/deleteStatus" class="inline-block" use:enhance>
									<input type="hidden" name="id" value={status.id} />
									<button type="submit" class="btn btn-sm btn-error">Delete</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p>No task statuses found.</p>
	{/if}
</div>
