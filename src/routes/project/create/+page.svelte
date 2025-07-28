<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Create Project</h1>
	<form method="POST" class="space-y-4">
		<div>
			<label class="label" for="projectName">
				<span class="label-text">Name</span>
			</label>
			<input type="text" name="name" id="projectName" class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label" for="organizationId">
				<span class="label-text">Organization</span>
			</label>
			<select name="organizationId" id="organizationId" class="select select-bordered w-full">
				{#each data.organizations as org}
					<option value={org.id}>{org.name}</option>
				{/each}
			</select>
		</div>
		<button type="submit" class="btn btn-primary">Create</button>
	</form>
</div>
