<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head><title>Pembayaran Berhasil</title></svelte:head>

<div class="mx-auto max-w-md py-16 text-center">
	<div class="text-5xl">✅</div>
	<h1 class="mt-4 text-2xl font-bold">Pembayaran Berhasil</h1>
	<p class="mt-2 text-sm opacity-70">
		Terima kasih. Membership Anda sedang diaktifkan. Jika status belum berubah, tunggu beberapa saat
		— konfirmasi gateway diproses secara asynchronous.
	</p>
	<div class="mt-6 flex justify-center gap-2">
		<button class="btn btn-primary btn-sm" onclick={() => goto('/billing')}>Lihat Billing</button>
		<button class="btn btn-ghost btn-sm" onclick={() => goto('/dashboard')}>Ke Dashboard</button>
	</div>
</div>
