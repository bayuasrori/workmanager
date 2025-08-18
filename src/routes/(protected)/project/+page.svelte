<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Projects</h1>
	<a href="/project/create" class="btn btn-primary mb-4">Create Project</a>
	<div class="overflow-x-auto">
		<table class="table w-full">
			<thead>
				<tr>
					<th>Name</th>
					<th>Organization ID</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.projects as project (project.id)}
					<tr>
						<td>{project.name}</td>
						<td>{project.organizationId}</td>
						<td class="flex gap-2">
							<a href="/project/{project.id}" class="btn btn-sm">Edit</a>
							<form method="POST" action="?/delete&id={project.id}">
								<button class="btn btn-sm btn-error">Delete</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
