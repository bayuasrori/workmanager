<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData | null; data: PageData } = $props();
</script>

<div class="min-h-screen bg-base-100 py-8">
	<div class="container mx-auto px-4 max-w-2xl">
		<div class="card bg-base-200 shadow-lg">
			<div class="card-body">
				<h1 class="card-title text-3xl mb-6">Buat Papan Publik</h1>
				<p class="text-base-content/70 mb-6">
					Buat papan publik yang dapat dilihat dan diikuti siapa saja. Cocok untuk proyek open
					source, inisiatif komunitas, atau pemantauan tugas bersama.
				</p>

				{#if form && typeof form === 'object' && 'message' in form}
					<div class="alert alert-error mb-6">
						<span>{form.message}</span>
					</div>
				{/if}

				<form method="post" action="?/create" use:enhance>
					<div class="form-control mb-4">
						<label class="label" for="name">
							<span class="label-text font-semibold">Nama Papan *</span>
						</label>
						<input
							id="name"
							name="name"
							type="text"
							placeholder="Masukkan nama papan"
							class="input input-bordered w-full"
							required
							maxlength="100"
						/>
						<div class="label">
							<span class="label-text-alt"
								>Nama ini akan dipakai untuk membuat URL unik papan Anda</span
							>
						</div>
					</div>

					<div class="form-control mb-6">
						<label class="label" for="description">
							<span class="label-text font-semibold">Deskripsi</span>
						</label>
						<textarea
							id="description"
							name="description"
							placeholder="Jelaskan kegunaan papan ini (opsional)"
							class="textarea textarea-bordered w-full h-24"
							maxlength="500"
						></textarea>
						<div class="label">
							<span class="label-text-alt"
								>Tambahan deskripsi supaya orang lain memahami tujuan papan</span
							>
						</div>
					</div>

					<div class="card bg-base-100 p-4 mb-6">
						<h3 class="font-semibold mb-2">✨ Yang Anda dapatkan:</h3>
						<ul class="text-sm text-base-content/70 space-y-1">
							<li>• URL publik yang bisa diakses siapa saja</li>
							<li>• Papan tugas bergaya Kanban</li>
							<li>• Gratis selamanya tanpa perlu mendaftar</li>
							<li>• Ideal untuk proyek open source</li>
						</ul>
					</div>

					<div class="flex gap-4">
						<button type="submit" class="btn btn-primary flex-1"> Buat Papan Publik </button>
						<a href="/" class="btn btn-outline">Batal</a>
					</div>
				</form>

				{#if data.isAuthenticated}
					<div class="divider">ATAU</div>
					<div class="text-center">
						<p class="text-sm text-base-content/70 mb-2">Ingin fitur manajemen tim yang lengkap?</p>
						<a href="/dashboard" class="btn btn-secondary btn-sm">Masuk ke Dashboard</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
