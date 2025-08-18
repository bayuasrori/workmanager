<script lang="ts">
	import Sidebar from '../../lib/components/Sidebar.svelte';

	let { children, data } = $props();
</script>

<div class="flex flex-col min-h-screen">
	<div class="navbar bg-base-100">
		<div class="flex-1">
			<a class="btn btn-ghost text-xl" href="/">WorkManager</a>
		</div>
		<div class="flex-none">
			<ul class="menu menu-horizontal px-1">
				<li><a href="/user">User</a></li>
				<li><a href="/tasks">Task</a></li>
				<li><a href="/project">Project</a></li>
				<li><a href="/org">Organization</a></li>
				<li><a href="/logout">Logout</a></li>
			</ul>
		</div>
	</div>
	<div class="flex flex-grow">
		<Sidebar {data} />
		<main class="flex-grow p-4">
			{@render children()}
		</main>
	</div>
</div>
