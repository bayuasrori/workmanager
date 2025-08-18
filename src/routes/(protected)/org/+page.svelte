<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Organizations</h1>
	<a href="/org/create" class="btn btn-primary mb-4">Create Organization</a>
	<div class="overflow-x-auto">
		<table class="table w-full">
			<thead>
				<tr>
					<th>Name</th>
					<th>Owner ID</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.organizations as org (org.id)}
					<tr>
						<td>{org.name}</td>
						<td>{org.ownerId}</td>
						<td class="flex gap-2">
							<a href="/org/{org.id}" class="btn btn-sm">Edit</a>
							<form method="POST" action="?/delete&id={org.id}">
								<button class="btn btn-sm btn-error">Delete</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
