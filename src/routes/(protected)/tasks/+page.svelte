<script lang="ts">
	import { deleteTask, getTasks } from './data.remote';

	const data = $derived(await getTasks());

	const handleDeleteTask = async (taskId: string) => {
		if (!confirm('Hapus tugas ini?')) return;
		try {
			await deleteTask({ taskId }).updates(getTasks());
		} catch (error) {
			console.error('Gagal menghapus tugas', error);
			alert('Gagal menghapus tugas. Silakan coba lagi.');
		}
	};
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
				{#each data.tasks as task (task.id)}
					<tr>
						<td>{task.name}</td>
						<td>{task.projectId}</td>
						<td>{task.assigneeId}</td>
						<td class="flex gap-2">
							<a href="/tasks/{task.id}" class="btn btn-sm">Edit</a>
							<button
								type="button"
								class="btn btn-sm btn-error"
								onclick={() => handleDeleteTask(task.id)}
							>
								Delete
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
