<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let statusName: string;
	export let open = false;

	let inputValue = '';
	const dispatch = createEventDispatcher();

	const handleConfirm = () => {
		if (inputValue === statusName) {
			dispatch('confirm');
		}
	};

	const handleCancel = () => {
		dispatch('cancel');
	};
</script>

{#if open}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Hapus Status</h3>
			<p class="py-4">
				Anda yakin ingin menghapus status <strong>{statusName}</strong>? Tindakan ini tidak dapat diurungkan. Semua tugas dalam status ini akan ikut terhapus.
			</p>
			<p>Untuk mengonfirmasi, ketik <strong>{statusName}</strong> di bawah ini:</p>
			<input
				type="text"
				class="input input-bordered w-full mt-2"
				bind:value={inputValue}
			/>
			<div class="modal-action">
				<button class="btn" on:click={handleCancel}>Batal</button>
				<button
					class="btn btn-error"
					disabled={inputValue !== statusName}
					on:click={handleConfirm}
				>
					Hapus
				</button>
			</div>
		</div>
	</dialog>
{/if}
