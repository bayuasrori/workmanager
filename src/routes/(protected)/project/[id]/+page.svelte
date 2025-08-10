<script lang="ts">

	const data = $props();

</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Edit Project: {data.project.name}</h1>
	<form method="POST" action="?/updateProject" class="space-y-4">
		<div>
			<label class="label" for="projectName">
				<span class="label-text">Name</span>
			</label>
			<input type="text" name="name" id="projectName" value={data.project.name} class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label" for="organizationId">
				<span class="label-text">Organization</span>
			</label>
			<select name="organizationId" id="organizationId" class="select select-bordered w-full">
				{#each data.organizations as org}
					<option value={org.id} selected={org.id === data.project.organizationId}>{org.name}</option>
				{/each}
			</select>
		</div>
		<button type="submit" class="btn btn-primary">Update Project</button>
	</form>
</div>
