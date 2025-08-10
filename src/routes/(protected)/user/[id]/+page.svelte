<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Edit User</h1>
	<form method="POST" class="space-y-4">
		<div>
			<label class="label">
				<span class="label-text">Username</span>
			</label>
			<input type="text" name="username" value={data.user.username} class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label">
				<span class="label-text">Age</span>
			</label>
			<input type="number" name="age" value={data.user.age} class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label">
				<span class="label-text">Password Hash</span>
			</label>
			<input type="text" name="passwordHash" value={data.user.passwordHash} class="input input-bordered w-full" />
		</div>
		<button type="submit" class="btn btn-primary">Update</button>
	</form>
</div>
