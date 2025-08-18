<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Edit Task Status</h1>
	<form method="POST" action="?/updateStatus" class="space-y-4">
		<div>
			<label class="label" for="statusName">
				<span class="label-text">Name</span>
			</label>
			<input
				type="text"
				name="name"
				id="statusName"
				value={data.taskStatus.name}
				class="input input-bordered w-full"
			/>
		</div>
		<button type="submit" class="btn btn-primary">Update</button>
	</form>
</div>
