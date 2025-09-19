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
		class="flex h-full min-h-full w-64 max-w-full flex-col border-r border-emerald-800 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50 shadow-xl"
		class:hidden={!isOpen}
		id="sidebar-content"
		aria-hidden={!isOpen}
	>
		<div
			class="px-4 py-4 sticky top-0 z-10 bg-emerald-900/80 backdrop-blur supports-[backdrop-filter]:bg-emerald-900/70 border-b border-emerald-800"
		>
			<div class="flex items-center justify-between gap-2">
				<h2 class="text-sm font-bold uppercase tracking-wider text-emerald-100">
					Quick Links
				</h2>
				<button
					type="button"
					on:click={toggleSidebar}
					class="btn btn-ghost btn-xs text-emerald-50 hover:bg-emerald-800/70"
					aria-expanded={isOpen}
					aria-controls="sidebar-content"
				>
					Hide
				</button>
			</div>
			<a
				href="/dashboard"
				class="btn btn-sm w-full mt-3 justify-start gap-3 border-none bg-emerald-700 hover:bg-emerald-600 text-emerald-50 shadow-md"
		>
				<span class="text-lg">🏠</span>
				<span class="font-semibold tracking-wide">Dashboard</span>
			</a>
			<hr class="my-4 border-emerald-700" />
			<div class="flex items-center justify-between gap-2">
				<h2 class="text-sm font-bold uppercase tracking-wider text-emerald-100">
					Organizations
				</h2>
			</div>
			<a
				href="/org/create"
				class="btn btn-sm w-full mt-3 border-none bg-amber-400 text-emerald-900 hover:bg-amber-300 font-semibold"
		>
				Create Organization
			</a>
			<a
				href="/import-board"
				class="btn btn-sm w-full mt-2 border border-emerald-500 bg-emerald-800/70 text-emerald-100 hover:bg-emerald-700"
		>
				Import Board
			</a>
		</div>
		<div class="flex-1 overflow-y-auto px-3 py-4">
			<ul class="space-y-2">
				{#each data.organizations.filter((o) => o.name !== 'Public') as org (org.id)}
					<li class="mb-1">
						<details open class="rounded-xl bg-emerald-900/60 border border-emerald-800">
							<summary
								class="font-semibold text-emerald-100 hover:text-amber-300 transition-colors px-3 py-2"
							>
								<span class="mr-2">📁</span>{org.name}
							</summary>
							<ul class="mt-1 ml-2 space-y-1 pb-2">
								{#each org.projects.filter((p) => !p.isPublic) as project (project.id)}
									<li>
										<a
											href="/project/{project.id}/tasks"
											class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-800/60 transition-colors"
										>
											<span class="text-base">📄</span>{project.name}
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
