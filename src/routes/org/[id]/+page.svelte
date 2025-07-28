<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: availableUsers = data.users.filter(
		(user) =>
			!data.members.some(
				(member) =>
					member.organizationId === data.organization.id && member.userId === user.id
			)
	);

	$: currentMembers = data.members.filter(
		(member) => member.organizationId === data.organization.id
	);
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Edit Organization: {data.organization.name}</h1>
	<form method="POST" action="?/updateOrganization" class="space-y-4">
		<div>
			<label class="label" for="orgName">
				<span class="label-text">Name</span>
			</label>
			<input type="text" name="name" id="orgName" value={data.organization.name} class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label" for="ownerId">
				<span class="label-text">Owner ID</span>
			</label>
			<input type="text" name="ownerId" id="ownerId" value={data.organization.ownerId} class="input input-bordered w-full" />
		</div>
		<button type="submit" class="btn btn-primary">Update Organization</button>
	</form>

	<h2 class="text-xl font-bold mt-8 mb-4">Members</h2>
	<div class="overflow-x-auto mb-4">
		<table class="table w-full">
			<thead>
				<tr>
					<th>User</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each currentMembers as member}
					<tr>
						<td>{data.users.find((user) => user.id === member.userId)?.username}</td>
						<td>
							<form method="POST" action="?/removeMember&userId={member.userId}">
								<button class="btn btn-sm btn-error">Remove</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h3 class="text-lg font-bold mb-2">Add Member</h3>
	<form method="POST" action="?/addMember" class="flex gap-2">
		<select name="userId" class="select select-bordered flex-grow">
			{#each availableUsers as user}
				<option value={user.id}>{user.username}</option>
			{/each}
		</select>
		<button type="submit" class="btn btn-primary">Add</button>
	</form>
</div>
