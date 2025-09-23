<script lang="ts">
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	export let data;
	let mobileOpen = false;
	let sidebarOpen = false;

	const handleSidebarItemClick = (event: Event) => {
		const target = event.target as HTMLElement | null;
		if (target?.closest('a')) {
			sidebarOpen = false;
		}
	};

	const handleSidebarKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			sidebarOpen = false;
			mobileOpen = false;
		}
	};

	onMount(() => {
		if (typeof window === 'undefined') return;
		const mediaQuery = window.matchMedia('(min-width: 1024px)');
		const handleChange = (event: MediaQueryListEvent) => {
			if (event.matches) {
				sidebarOpen = false;
			}
		};

		if (mediaQuery.matches) {
			sidebarOpen = false;
		}

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	});
</script>

<svelte:window onkeydown={handleSidebarKeydown} />

<div class="flex flex-col min-h-screen">
	<div
		class="navbar sticky top-0 z-40 w-full bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 backdrop-blur supports-[backdrop-filter]:bg-base-100/80 shadow-sm relative px-3 sm:px-4"
	>
		<div class="navbar-start flex items-center gap-1">
			<button
				type="button"
				class="btn btn-ghost btn-square lg:hidden"
				aria-label="Open sidebar"
				aria-controls="mobile-sidebar"
				aria-expanded={sidebarOpen}
				onclick={() => {
					sidebarOpen = true;
					mobileOpen = false;
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 5h18M3 12h18M9 19h12"
					/></svg
				>
			</button>
			<a
				class="btn btn-ghost normal-case text-xl font-extrabold tracking-tight hover:scale-[1.02] transition-transform"
				href="/"
			>
				<span class="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
					>Papanin</span
				>
			</a>
		</div>
		<div class="navbar-end flex items-center gap-2">
			<!-- Desktop navigation -->
			<nav class="hidden lg:flex items-center gap-1">
				<a
					class="btn btn-ghost btn-sm rounded-lg transition-colors hover:bg-base-200/60"
					href="/user/{data.user.id}">User</a
				>
				<a
					class="btn btn-ghost btn-sm rounded-lg transition-colors hover:bg-base-200/60"
					href="/org">Organization</a
				>
			</nav>
			<!-- User dropdown (desktop) -->
			{#if data?.user}
				<div class="dropdown dropdown-end hidden lg:block z-50">
					<button
						type="button"
						class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-base-200/70 transition-colors cursor-pointer"
					>
						<div class="avatar placeholder">
							<div
								class="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
							>
								<span class="text-sm leading-none"
									>{data.user.username?.[0]?.toUpperCase() || 'U'}</span
								>
							</div>
						</div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 opacity-60"
							viewBox="0 0 20 20"
							fill="currentColor"
							><path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
								clip-rule="evenodd"
							/></svg
						>
					</button>
					<ul class="dropdown-content z-[60] menu p-2 shadow bg-base-100 rounded-box w-52">
						<li><a href="/user/{data.user.id}">Profile {data.user.username}</a></li>
						<li><a href="/logout">Logout</a></li>
					</ul>
				</div>
			{/if}
			<!-- Mobile menu button -->
			<button
				class="btn btn-ghost btn-square lg:hidden"
				aria-label="Open menu"
				aria-controls="mobile-nav"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/></svg
				>
			</button>
		</div>
		{#if mobileOpen}
			<div
				id="mobile-nav"
				class="lg:hidden absolute right-2 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl shadow-xl border border-base-300 bg-base-100/90 backdrop-blur supports-[backdrop-filter]:bg-base-100/80 z-50"
			>
				<ul class="menu menu-sm p-2">
					<li>
						<a
							class="rounded-lg transition-colors"
							href="/user/{data.user.id}"
							onclick={() => (mobileOpen = false)}>User</a
						>
					</li>
					<li>
						<a class="rounded-lg transition-colors" href="/org" onclick={() => (mobileOpen = false)}
							>Organization</a
						>
					</li>
					{#if data?.user}
						<li class="pt-2">
							<span class="px-2 text-xs opacity-60">Signed in as {data.user.username}</span>
						</li>
						<li class="pt-1">
							<a
								class="btn btn-sm btn-outline w-full"
								href="/logout"
								onclick={() => (mobileOpen = false)}>Logout</a
							>
						</li>
					{/if}
				</ul>
			</div>
		{/if}
	</div>

	{#if sidebarOpen}
		<div
			class="lg:hidden fixed inset-0 z-50"
			role="dialog"
			aria-modal="true"
			aria-labelledby="mobile-sidebar-title"
		>
			<div
				class="absolute inset-0 bg-base-content/30 backdrop-blur-sm"
				role="button"
				tabindex="0"
				aria-label="Close sidebar"
				onclick={() => (sidebarOpen = false)}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						sidebarOpen = false;
					}
				}}
			></div>
			<div
				id="mobile-sidebar"
				class="absolute left-0 top-0 h-full w-64 max-w-[calc(100vw-2rem)] shadow-2xl bg-base-200/95 backdrop-blur supports-[backdrop-filter]:bg-base-200/80"
			>
				<h2 id="mobile-sidebar-title" class="sr-only">Sidebar navigation</h2>
				<Sidebar {data} on:click={handleSidebarItemClick} on:close={() => (sidebarOpen = false)} isMobile={true} />
			</div>
		</div>
	{/if}

	<div class="flex flex-grow">
		<div class="hidden lg:block flex-shrink-0">
			<Sidebar {data} />
		</div>
		<main class="flex-grow min-w-0 p-4">
			<slot />
		</main>
	</div>
</div>
