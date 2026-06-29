<script lang="ts">
	import '../app.css';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<meta property="og:image" content="/preview.png" />
	<meta property="og:image:alt" content="Tampilan landing page Papanin" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="/preview.png" />
</svelte:head>

<svelte:boundary>
	{@render children()}

	{#snippet pending()}
		<div class="min-h-screen flex items-center justify-center bg-base-200">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{/snippet}
</svelte:boundary>

<Toast />
