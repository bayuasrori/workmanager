<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { toasts, consumeFlashToast, type ToastKind } from '$lib/toast.svelte';

	onMount(() => {
		const flash = consumeFlashToast();
		if (flash) toasts.push(flash.kind, flash.message);
	});

	const alertClass: Record<ToastKind, string> = {
		success: 'alert-success',
		error: 'alert-error',
		info: 'alert-info'
	};
</script>

<div class="toast toast-top toast-end z-[100] pointer-events-none">
	{#each toasts.items as t (t.id)}
		<div
			role="alert"
			transition:fly={{ y: -16, duration: 200 }}
			class="alert {alertClass[t.kind]} shadow-lg pointer-events-auto max-w-sm"
		>
			{#if t.kind === 'success'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current shrink-0 h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/></svg
				>
			{:else if t.kind === 'error'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current shrink-0 h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/></svg
				>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current shrink-0 h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/></svg
				>
			{/if}
			<span class="text-sm font-medium">{t.message}</span>
			<button
				type="button"
				class="btn btn-ghost btn-xs btn-circle"
				aria-label="Tutup notifikasi"
				onclick={() => toasts.dismiss(t.id)}>✕</button
			>
		</div>
	{/each}
</div>
