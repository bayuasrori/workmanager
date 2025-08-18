<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Users</h1>
	<a href="/user/create" class="btn btn-primary mb-4">Create User</a>
	<div class="overflow-x-auto">
		<table class="table w-full">
			<thead>
				<tr>
					<th>Username</th>
					<th>Age</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user (user.id)}
					<tr>
						<td>{user.username}</td>
						<td>{user.age}</td>
						<td class="flex gap-2">
							<a href="/user/{user.id}" class="btn btn-sm">Edit</a>
							<form method="POST" action="?/delete&id={user.id}">
								<button class="btn btn-sm btn-error">Delete</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
