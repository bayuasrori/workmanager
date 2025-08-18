<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Create Organization</h1>
	<form method="POST" class="space-y-4">
		<div>
			<label class="label" for="name">
				<span class="label-text">Name</span>
			</label>
			<input type="text" id="name" name="name" class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label" for="ownerId">
				<span class="label-text">Owner</span>
			</label>
			<select name="ownerId" id="ownerId" class="select select-bordered w-full">
				{#each data.users as user (user.id)}
					<option value={user.id}>{user.username}</option>
				{/each}
			</select>
		</div>
		<button type="submit" class="btn btn-primary">Create</button>
	</form>
</div>
