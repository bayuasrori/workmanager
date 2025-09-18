<script lang="ts">
	type SidebarProject = {
		id: string;
		name: string;
		isPublic: boolean | null;
		organizationId: string | null;
	};

	type SidebarOrganization = {
		id: string;
		name: string;
		projects: SidebarProject[];
	};

	export let data: { organizations: SidebarOrganization[] };

	let isOpen = true;

	const toggleSidebar = () => {
		isOpen = !isOpen;
	};
</script>

<div class="flex h-full min-h-full flex-col">
	{#if !isOpen}
		<button
			type="button"
			on:click={toggleSidebar}
			class="btn btn-ghost btn-sm mb-2 self-start"
			aria-expanded={isOpen}
			aria-controls="sidebar-content"
		>
			Show Sidebar
		</button>
	{/if}
	<aside
		class="flex h-full min-h-full w-64 max-w-full flex-col border-r border-base-300 bg-base-200/80 backdrop-blur supports-[backdrop-filter]:bg-base-200/70 shadow-sm"
		class:hidden={!isOpen}
		id="sidebar-content"
		aria-hidden={!isOpen}
	>
		<div
			class="px-4 py-3 sticky top-0 z-10 bg-base-200/80 backdrop-blur supports-[backdrop-filter]:bg-base-200/60 border-b border-base-300"
		>
			<div class="flex items-center justify-between gap-2">
				<h2 class="text-sm font-bold uppercase tracking-wider text-base-content/70">
					Organizations
				</h2>
				<button
					type="button"
					on:click={toggleSidebar}
					class="btn btn-ghost btn-xs"
					aria-expanded={isOpen}
					aria-controls="sidebar-content"
				>
					Hide
				</button>
			</div>
			<a href="/org/create" class="btn btn-primary btn-sm w-full mt-2">Create Organization</a>
			<a href="/import-board" class="btn btn-secondary btn-sm w-full mt-2">Import Board</a>
		</div>
		<div class="flex-1 overflow-y-auto px-2 py-3">
			<ul class="menu text-base-content">
				{#each data.organizations.filter((o) => o.name !== 'Public') as org (org.id)}
					<li class="mb-1">
						<details open class="rounded-lg">
							<summary
								class="font-semibold text-base-content/90 hover:text-primary transition-colors"
							>
								<span class="mr-2">📁</span>{org.name}
							</summary>
							<ul class="mt-1 ml-2">
								{#each org.projects.filter((p) => !p.isPublic) as project (project.id)}
									<li>
										<a
											href="/project/{project.id}/tasks"
											class="rounded-md hover:bg-base-300/60 transition-colors"
										>
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
</div>
