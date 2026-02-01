<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createTask, getTaskCreateData } from './data.remote';

	const selectedProjectId = $derived($page.url.searchParams.get('projectId') ?? undefined);
	const data = $derived(await getTaskCreateData({ projectId: selectedProjectId }));

	let name = $state('');
	let projectId = $state('');
	let assigneeId = $state('');
	let statusId = $state('');

	$effect(() => {
		projectId = selectedProjectId ?? '';
	});

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) return;
		try {
			await createTask({
				name: trimmedName,
				projectId: projectId || undefined,
				assigneeId: assigneeId || undefined,
				statusId: statusId || undefined
			});
			await goto('/tasks');
		} catch (error) {
			console.error('Gagal membuat tugas', error);
			alert('Gagal membuat tugas. Silakan coba lagi.');
		}
	};
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Create Task</h1>
	<form class="space-y-4" onsubmit={handleSubmit}>
		<div>
			<label class="label" for="taskName">
				<span class="label-text">Name</span>
			</label>
			<input type="text" id="taskName" bind:value={name} class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label" for="projectId">
				<span class="label-text">Project</span>
			</label>
			<select id="projectId" bind:value={projectId} class="select select-bordered w-full">
				<option value="">Pilih proyek</option>
				{#each data.projects as project (project.id)}
					<option value={project.id}>{project.name}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="label" for="assigneeId">
				<span class="label-text">Assignee</span>
			</label>
			<select id="assigneeId" bind:value={assigneeId} class="select select-bordered w-full">
				<option value="">Pilih anggota</option>
				{#each data.users as user (user.id)}
					<option value={user.id}>{user.username}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="label" for="statusId">
				<span class="label-text">Status</span>
			</label>
			<select id="statusId" bind:value={statusId} class="select select-bordered w-full">
				<option value="">Pilih status</option>
				{#each data.taskStatuses as status (status.id)}
					<option value={status.id}>{status.name}</option>
				{/each}
			</select>
		</div>
		<button type="submit" class="btn btn-primary">Create</button>
	</form>
</div>
