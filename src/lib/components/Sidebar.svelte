<script lang="ts">
	// import type { PageData } from '../../routes/$types';

	export let data;
</script>

<aside class="w-64 min-h-full border-r border-base-300 bg-base-200/80 backdrop-blur supports-[backdrop-filter]:bg-base-200/70 shadow-sm">
	<div class="px-4 py-3 sticky top-0 z-10 bg-base-200/80 backdrop-blur supports-[backdrop-filter]:bg-base-200/60 border-b border-base-300">
		<h2 class="text-sm font-bold uppercase tracking-wider text-base-content/70">Organizations</h2>
		<a href="/org/create" class="btn btn-primary btn-sm w-full mt-2">Create Organization</a>
		<a href="/import-board" class="btn btn-secondary btn-sm w-full mt-2">Import Board</a>
	</div>
	<div class="overflow-y-auto h-[calc(100vh-3rem)] px-2 py-3">
		<ul class="menu text-base-content">
			{#each data.organizations.filter((o: any) => o.name !== 'Public') as org (org.id)}
				<li class="mb-1">
					<details open class="rounded-lg">
						<summary class="font-semibold text-base-content/90 hover:text-primary transition-colors">
							<span class="mr-2">📁</span>{org.name}
						</summary>
						<ul class="mt-1 ml-2">
							{#each org.projects.filter((p: any) => !p.isPublic) as project (project.id)}
								<li>
									<a href="/project/{project.id}/tasks" class="rounded-md hover:bg-base-300/60 transition-colors" >
										<span class="mr-2">📄</span>{project.name}
									</a>
								</li>
							{/each}
						</ul>
					</details>
				</li>
			{/each}
		</ul>
	</div>
</aside>
