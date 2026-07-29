<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head><title>Pembayaran Dibatalkan</title></svelte:head>

<div class="mx-auto max-w-md py-16 text-center">
	<div class="text-5xl">❌</div>
	<h1 class="mt-4 text-2xl font-bold">Pembayaran Dibatalkan</h1>
	<p class="mt-2 text-sm opacity-70">
		Anda membatalkan pembayaran. Tidak ada biaya yang dikenakan.
	</p>
	<div class="mt-6 flex justify-center gap-2">
		<button class="btn btn-primary btn-sm" onclick={() => goto('/billing')}
			>Kembali ke Billing</button
		>
	</div>
</div>
