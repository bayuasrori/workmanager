<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getTaskStatusDetails, updateStatus } from './data.remote';

	const statusId = $derived($page.params.id ?? '');
	const data = $derived(await getTaskStatusDetails({ statusId }));
	let name = $state('');

	$effect(() => {
		name = data.taskStatus.name;
	});

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		if (!statusId) return;
		const trimmed = name.trim();
		if (!trimmed) return;
		try {
			await updateStatus({ statusId, name: trimmed });
			await goto('/task-status');
		} catch (error) {
			console.error('Gagal memperbarui status', error);
			alert('Gagal memperbarui status. Silakan coba lagi.');
		}
	};
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Edit Task Status</h1>
	<form class="space-y-4" onsubmit={handleSubmit}>
		<div>
			<label class="label" for="statusName">
				<span class="label-text">Name</span>
			</label>
			<input type="text" id="statusName" bind:value={name} class="input input-bordered w-full" />
		</div>
		<button type="submit" class="btn btn-primary">Update</button>
	</form>
</div>
