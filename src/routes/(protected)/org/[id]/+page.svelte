<script lang="ts">
	import { page } from '$app/stores';
	import {
		addMember,
		getOrganizationDetails,
		removeMember,
		updateOrganization
	} from './data.remote';

	const organizationId = $derived($page.params.id ?? '');
	const data = $derived(await getOrganizationDetails({ organizationId }));

	let organizationName = $state('');
	let ownerId = $state('');
	let selectedUserId = $state('');

	$effect(() => {
		organizationName = data.organization.name;
		ownerId = data.organization.ownerId ?? '';
	});

	const availableUsers = $derived.by(() =>
		data.users.filter(
			(user) =>
				!data.members.some(
					(member) => member.organizationId === data.organization.id && member.userId === user.id
				)
		)
	);

	const currentMembers = $derived.by(() =>
		data.members.filter((member) => member.organizationId === data.organization.id)
	);

	const handleUpdateOrganization = async (event: Event) => {
		event.preventDefault();
		if (!organizationId) return;
		try {
			await updateOrganization({
				organizationId,
				name: organizationName,
				ownerId
			}).updates(getOrganizationDetails({ organizationId }));
		} catch (error) {
			console.error('Gagal memperbarui organisasi', error);
			alert('Gagal memperbarui organisasi. Silakan coba lagi.');
		}
	};

	const handleAddMember = async (event: Event) => {
		event.preventDefault();
		if (!selectedUserId || !organizationId) return;
		try {
			await addMember({ organizationId, userId: selectedUserId }).updates(
				getOrganizationDetails({ organizationId })
			);
			selectedUserId = '';
		} catch (error) {
			console.error('Gagal menambahkan anggota', error);
			alert('Gagal menambahkan anggota. Silakan coba lagi.');
		}
	};

	const handleRemoveMember = async (userId: string) => {
		if (!confirm('Hapus anggota ini?') || !organizationId) return;
		try {
			await removeMember({ organizationId, userId }).updates(
				getOrganizationDetails({ organizationId })
			);
		} catch (error) {
			console.error('Gagal menghapus anggota', error);
			alert('Gagal menghapus anggota. Silakan coba lagi.');
		}
	};
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Edit Organization: {data.organization.name}</h1>
	<form class="space-y-4" onsubmit={handleUpdateOrganization}>
		<div>
			<label class="label" for="orgName">
				<span class="label-text">Name</span>
			</label>
			<input
				type="text"
				id="orgName"
				bind:value={organizationName}
				class="input input-bordered w-full"
			/>
		</div>
		<div>
			<label class="label" for="ownerId">
				<span class="label-text">Owner ID</span>
			</label>
			<input type="text" id="ownerId" bind:value={ownerId} class="input input-bordered w-full" />
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
				{#each currentMembers as member (member.userId)}
					<tr>
						<td>{data.users.find((user) => user.id === member.userId)?.username}</td>
						<td>
							<button
								type="button"
								class="btn btn-sm btn-error"
								onclick={() => handleRemoveMember(member.userId)}
							>
								Remove
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h3 class="text-lg font-bold mb-2">Add Member</h3>
	<form class="flex gap-2" onsubmit={handleAddMember}>
		<select bind:value={selectedUserId} class="select select-bordered flex-grow">
			<option value="" disabled selected>Pilih anggota</option>
			{#each availableUsers as user (user.id)}
				<option value={user.id}>{user.username}</option>
			{/each}
		</select>
		<button type="submit" class="btn btn-primary">Add</button>
	</form>
</div>
