<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';
	import { navigationTarget } from '$lib/stores';

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

	type Entitlement = {
		plan: string;
		isTrial: boolean;
		seats: number;
		aiAllowance: number;
		aiRemaining: number;
		topupBalance: number;
	};

	export let data: {
		organizations: SidebarOrganization[];
		user: { isAdmin?: boolean | null | undefined };
		entitlement?: Entitlement | null;
	};
	export let isMobile = false;

	let isOpen = true;

	const dispatch = createEventDispatcher();

	const toggleSidebar = () => {
		if (isMobile) {
			dispatch('close');
		} else {
			isOpen = !isOpen;
		}
	};

	$: isNavLoading = (path: string) => {
		return $navigationTarget === path;
	};

	$: isActive = (path: string) => {
		return $page.url.pathname === path;
	};

	$: isProjectActive = (projectId: string) => {
		return $page.url.pathname === `/project/${projectId}/tasks`;
	};

	$: isProjectLoading = (projectId: string) => {
		return $navigationTarget === `/project/${projectId}/tasks`;
	};

	const getInitials = (name: string) => {
		return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
	};
</script>

<div class="flex h-full min-h-full flex-col">
	{#if !isOpen}
		<div
			class="flex h-full w-14 flex-col items-center border-r border-emerald-800 bg-emerald-950 py-3"
		>
			<button
				type="button"
				on:click={toggleSidebar}
				class="btn btn-ghost btn-square btn-sm mb-4 text-emerald-200 hover:bg-emerald-800"
				aria-expanded={isOpen}
				aria-controls="sidebar-content"
				aria-label="Buka sidebar"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
				</svg>
			</button>
			<a href="/dashboard" class="btn btn-ghost btn-square btn-sm mb-1 text-emerald-100 hover:bg-emerald-800" class:bg-emerald-700={isActive('/dashboard')} aria-label="Dashboard">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
			</a>
			<a href="/timeline" class="btn btn-ghost btn-square btn-sm mb-1 text-emerald-100 hover:bg-emerald-800" class:bg-emerald-700={isActive('/timeline')} aria-label="Timeline">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</a>
			<a href="/notes-import" class="btn btn-ghost btn-square btn-sm text-emerald-100 hover:bg-emerald-800" class:bg-emerald-700={isActive('/notes-import')} aria-label="Impor Catatan">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</a>
		</div>
	{/if}

	{#if isOpen}
		<aside
			class="flex h-full min-h-full w-64 max-w-full flex-col border-r border-emerald-800 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50 shadow-xl"
			id="sidebar-content"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-4 py-4">
				<a href="/dashboard" class="flex items-center gap-2.5 group">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-sm shadow-sm">
						P
					</div>
					<span class="text-base font-semibold tracking-tight group-hover:text-amber-300 transition-colors">Papanin</span>
				</a>
				<button
					type="button"
					on:click={toggleSidebar}
					class="btn btn-ghost btn-square btn-xs text-emerald-300 hover:bg-emerald-800"
					aria-expanded={isOpen}
					aria-controls="sidebar-content"
					aria-label={isMobile ? 'Tutup sidebar' : 'Sembunyikan sidebar'}
				>
					{#if isMobile}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
						</svg>
					{/if}
				</button>
			</div>

			<!-- Scrollable content -->
			<div class="flex-1 overflow-y-auto px-3 pb-3">
				<!-- Navigation -->
				<nav class="space-y-0.5">
					<a
						href="/dashboard"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
							{isActive('/dashboard') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
						</svg>
						<span>Dashboard</span>
						{#if isNavLoading('/dashboard')}
							<span class="loading loading-spinner loading-xs ml-auto"></span>
						{/if}
					</a>

					<a
						href="/timeline"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
							{isActive('/timeline') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<span>Timeline</span>
						{#if isNavLoading('/timeline')}
							<span class="loading loading-spinner loading-xs ml-auto"></span>
						{/if}
					</a>

					<a
						href="/notes-import"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
							{isActive('/notes-import') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<span>Impor Catatan</span>
						{#if isNavLoading('/notes-import')}
							<span class="loading loading-spinner loading-xs ml-auto"></span>
						{/if}
					</a>

					<a
						href="/billing"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
							{isActive('/billing') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
						</svg>
						<span>Billing</span>
						{#if isNavLoading('/billing')}
							<span class="loading loading-spinner loading-xs ml-auto"></span>
						{/if}
					</a>

					{#if data.user?.isAdmin}
						<div class="pt-3">
							<p class="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">Admin</p>
							<div class="space-y-0.5">
								<a
									href="/admin/dashboard"
									class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
										{isActive('/admin/dashboard') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
									</svg>
									<span>Dashboard</span>
								</a>
								<a
									href="/admin/payments"
									class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
										{isActive('/admin/payments') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
									<span>Payments</span>
								</a>
								<a
									href="/admin/memberships"
									class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
										{isActive('/admin/memberships') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
									<span>Memberships</span>
								</a>
								<a
									href="/admin/payment-gateways"
									class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
										{isActive('/admin/payment-gateways') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
									<span>Gateways</span>
								</a>
								<a
									href="/admin/membership-types"
									class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
										{isActive('/admin/membership-types') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
									</svg>
									<span>Plan</span>
								</a>
								<a
									href="/admin/payment-activity"
									class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
										{isActive('/admin/payment-activity') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
									<span>Activity</span>
								</a>
								<a
									href="/admin/smtp-test"
									class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
										{isActive('/admin/smtp-test') ? 'bg-emerald-700 text-emerald-50 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-emerald-50'}"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span>SMTP Test</span>
								</a>
							</div>
						</div>
					{/if}
				</nav>

				<!-- Divider -->
				<hr class="my-3 border-emerald-800" />

				<!-- Workspace section -->
				<div>
					<div class="flex items-center justify-between px-3 pb-2">
						<p class="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">Workspace</p>
						<div class="flex gap-0.5">
							<a
								href="/org/create"
								class="btn btn-ghost btn-xs btn-square text-emerald-300 hover:bg-emerald-800"
								title="Buat organisasi baru"
							>
								{#if isNavLoading('/org/create')}
									<span class="loading loading-spinner loading-xs"></span>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
									</svg>
								{/if}
							</a>
						</div>
					</div>

					{#if data.organizations.filter((o) => o.name !== 'Public').length === 0}
						<div class="rounded-lg bg-emerald-900/60 px-3 py-4 text-center">
							<p class="text-xs text-emerald-200/60">Belum ada organisasi</p>
							<a href="/org/create" class="btn btn-xs mt-2 bg-amber-400 text-emerald-900 hover:bg-amber-300 border-none">Buat Organisasi</a>
						</div>
					{:else}
						<div class="space-y-0.5">
							{#each data.organizations.filter((o) => o.name !== 'Public') as org}
								<details class="group/org" open>
									<summary class="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-emerald-800/60 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0 text-emerald-400 transition-transform duration-200 group-open/org:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
										</svg>
										<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-emerald-100 text-[10px] font-bold">
											{getInitials(org.name)}
										</div>
										<span class="truncate font-medium text-emerald-100 group-hover/org:text-amber-300 transition-colors">{org.name}</span>
									</summary>
									<div class="ml-[22px] mt-0.5 space-y-0.5 border-l border-emerald-800 pl-2.5">
										{#each org.projects.filter((p) => !p.isPublic) as project}
											<a
												href="/project/{project.id}/tasks"
												class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-150
													{isProjectActive(project.id) ? 'bg-emerald-700 text-emerald-50 font-medium' : 'text-emerald-100/80 hover:bg-emerald-800/60 hover:text-emerald-50'}"
											>
												<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
												</svg>
												<span class="truncate">{project.name}</span>
												{#if project.isPublic}
													<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
														<path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
												{/if}
												{#if isProjectLoading(project.id)}
													<span class="loading loading-spinner loading-xs ml-auto"></span>
												{/if}
											</a>
										{/each}

										<a
											href="/project/create"
											class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-emerald-300/60 hover:bg-emerald-800/60 hover:text-emerald-200 transition-colors"
										>
											{#if isNavLoading('/project/create')}
												<span class="loading loading-spinner loading-xs"></span>
											{:else}
												<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
												</svg>
											{/if}
											<span>Tambah project</span>
										</a>
									</div>
								</details>
							{/each}
						</div>
					{/if}

					<a
						href="/import-board"
						class="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-emerald-200/70 hover:bg-emerald-800/60 hover:text-emerald-100 transition-colors"
					>
						{#if isNavLoading('/import-board')}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
							</svg>
						{/if}
						<span>Impor Board</span>
					</a>
				</div>
			</div>

			<!-- Footer: Entitlement -->
			{#if data.entitlement}
				{@const ent = data.entitlement}
				{@const aiUsedPct = ent.aiAllowance > 0 ? Math.round(((ent.aiAllowance - ent.aiRemaining) / ent.aiAllowance) * 100) : 0}
				<div class="border-t border-emerald-800 px-4 py-3">
					<div class="flex items-center gap-2 mb-2">
						<span class="badge badge-sm border-emerald-600 bg-emerald-800 text-emerald-100 font-medium capitalize">
							{ent.plan}
						</span>
						{#if ent.isTrial}
							<span class="badge badge-sm border-amber-500 bg-amber-500/20 text-amber-300">Trial</span>
						{/if}
					</div>
					<div>
						<div class="flex items-center justify-between text-[11px] text-emerald-300/70 mb-1">
							<span>🤖 AI Usage</span>
							<span>{ent.aiAllowance - ent.aiRemaining}/{ent.aiAllowance}</span>
						</div>
						<div class="h-1.5 w-full rounded-full bg-emerald-800 overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-300
									{aiUsedPct > 80 ? 'bg-red-400' : aiUsedPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}"
								style="width: {aiUsedPct}%"
							></div>
						</div>
						{#if ent.topupBalance > 0}
							<p class="mt-1.5 text-[11px] text-emerald-300/50">
								Topup: Rp {ent.topupBalance.toLocaleString('id-ID')}
							</p>
						{/if}
					</div>
				</div>
			{/if}
		</aside>
	{/if}
</div>
