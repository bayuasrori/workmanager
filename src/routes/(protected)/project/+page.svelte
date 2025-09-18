<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold">Projects</h1>
		<a href="/project/create" class="btn btn-primary self-start sm:self-auto">Create Project</a>
	</div>

	{#if data.projects.length}
		<!-- Mobile list -->
		<div class="mt-4 flex flex-col gap-3 lg:hidden">
			{#each data.projects as project (project.id)}
				<article class="rounded-xl border border-base-300 bg-base-100/80 shadow-sm p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h2 class="text-lg font-semibold text-base-content">{project.name}</h2>
							<p class="text-sm text-base-content/70">Org ID: {project.organizationId}</p>
						</div>
					</div>
					<div class="mt-4 flex flex-wrap items-center gap-2">
						<a href="/project/{project.id}" class="btn btn-sm">Edit</a>
						<form method="POST" action="?/delete&id={project.id}" class="contents">
							<button class="btn btn-sm btn-error">Delete</button>
						</form>
					</div>
				</article>
			{/each}
		</div>

		<!-- Desktop table -->
		<div class="mt-4 hidden overflow-x-auto lg:block">
			<table class="table w-full">
				<thead>
					<tr>
						<th>Name</th>
						<th>Organization ID</th>
						<th class="w-40">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.projects as project (project.id)}
						<tr>
							<td class="align-middle">{project.name}</td>
							<td class="align-middle">{project.organizationId}</td>
							<td class="align-middle">
								<div class="flex flex-wrap gap-2">
									<a href="/project/{project.id}" class="btn btn-sm">Edit</a>
									<form method="POST" action="?/delete&id={project.id}" class="contents">
										<button class="btn btn-sm btn-error">Delete</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p
			class="mt-6 rounded-lg border border-dashed border-base-300 bg-base-100/60 p-6 text-center text-base-content/70"
		>
			No projects yet. Create your first project to get started.
		</p>
	{/if}
</div>
