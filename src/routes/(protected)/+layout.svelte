<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children, data } = $props();
	let mobileOpen = $state(false);
</script>

<div class="flex flex-col min-h-screen">
	<div class="navbar sticky top-0 z-40 bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 backdrop-blur supports-[backdrop-filter]:bg-base-100/80 shadow-sm relative px-4">
		<div class="flex-1 items-center">
			<a class="btn btn-ghost normal-case text-xl font-extrabold tracking-tight hover:scale-[1.02] transition-transform" href="/">
				<span class="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">WorkManager</span>
			</a>
		</div>
		<div class="flex-none items-center gap-2">
			<!-- Desktop menu -->
			<ul class="menu menu-horizontal px-1 gap-1 hidden lg:flex">
				<li><a class="hover:bg-base-200/60 rounded-lg transition-colors" href="/user/{data.user.id}">User</a></li>
				<li><a class="hover:bg-base-200/60 rounded-lg transition-colors" href="/org">Organization</a></li>
			<!-- User dropdown (desktop) -->
			{#if data?.user}
				<div class="dropdown dropdown-end hidden lg:block z-50">
					<button type="button" class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-base-200/70 transition-colors cursor-pointer">
						<div class="avatar placeholder">
							<div class="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
								<span class="text-sm leading-none">{data.user.username?.[0]?.toUpperCase() || 'U'}</span>
							</div>
						</div>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/></svg>
					</button>
					<ul class="dropdown-content z-[60] menu p-2 shadow bg-base-100 rounded-box w-52">
						<li><a href="/user/{data.user.id}">Profile {data.user.username}</a></li>
						<li><a href="/logout">Logout</a></li>
					</ul>
				</div>
			{/if}
		</ul>

			<!-- Mobile menu button -->
			<button class="btn btn-ghost lg:hidden" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded={mobileOpen} onclick={() => (mobileOpen = !mobileOpen)}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
			</button>
		</div>
		{#if mobileOpen}
			<div id="mobile-nav" class="lg:hidden absolute right-2 top-full mt-2 w-64 rounded-xl shadow-xl border border-base-300 bg-base-100/90 backdrop-blur supports-[backdrop-filter]:bg-base-100/80 z-50">
				<ul class="menu menu-sm p-2">
					<li><a class="rounded-lg transition-colors" href="/user/{data.user.id}" onclick={() => (mobileOpen = false)}>User</a></li>
					<li><a class="rounded-lg transition-colors" href="/org" onclick={() => (mobileOpen = false)}>Organization</a></li>
					{#if data?.user}
						<li class="pt-2"><span class="px-2 text-xs opacity-60">Signed in as {data.user.username}</span></li>
						<li class="pt-1"><a class="btn btn-sm btn-outline w-full" href="/logout" onclick={() => (mobileOpen = false)}>Logout</a></li>
					{/if}
				</ul>
			</div>
		{/if}
	</div>
	<div class="flex flex-grow">
		<Sidebar data={data} />
		<main class="flex-grow p-4">
			{@render children()}
		</main>
	</div>
</div>
