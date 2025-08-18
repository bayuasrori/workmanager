<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Edit User</h1>
	{#if data.user}
	<form method="POST" class="space-y-4">
		<div>
			<label class="label" for="username">
				<span class="label-text">Username</span>
			</label>
			<input
				type="text"
				name="username"
				id="username"
				value={data.user.username}
				class="input input-bordered w-full"
			/>
		</div>
		<div>
			<label class="label" for="age">
				<span class="label-text">Age</span>
			</label>
			<input type="number" id="age" name="age" value={data.user.age} class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label" for="passwordHash">
				<span class="label-text">Password Hash</span>
			</label>
			<input
				type="text"
				name="passwordHash"
				id="passwordHash"
				value={data.user.passwordHash}
				class="input input-bordered w-full"
			/>
		</div>
		<button type="submit" class="btn btn-primary">Update</button>
	</form>
	{/if}
</div>
