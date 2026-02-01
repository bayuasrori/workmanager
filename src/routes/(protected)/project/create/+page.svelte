<script lang="ts">
	import { goto } from '$app/navigation';
	import { createProject, getProjectCreateData } from './data.remote';

	const data = $derived(await getProjectCreateData());
	let name = $state('');
	let organizationId = $state('');

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) return;
		try {
			await createProject({
				name: trimmedName,
				organizationId: organizationId || undefined
			});
			await goto('/project');
		} catch (error) {
			console.error('Gagal membuat proyek', error);
			alert('Gagal membuat proyek. Silakan coba lagi.');
		}
	};
</script>

<div
	class="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-emerald-50 via-emerald-100 to-amber-50 px-4 py-10"
>
	<div class="w-full max-w-3xl">
		<div class="mb-6 text-center">
			<p class="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Proyek baru</p>
			<h1 class="mt-2 text-4xl font-extrabold text-emerald-900">Buat Proyek</h1>
			<p class="mt-3 text-base text-emerald-800/70">
				Mulai papan kerja baru, hubungkan ke organisasi, dan undang timmu untuk berkolaborasi.
			</p>
		</div>
		<div class="card shadow-2xl border border-emerald-200/70 bg-white/90 backdrop-blur">
			<div class="card-body p-8">
				<form class="grid gap-6" onsubmit={handleSubmit}>
					<div class="grid gap-2">
						<label
							class="text-sm font-semibold uppercase tracking-wide text-emerald-900"
							for="projectName">Nama Proyek</label
						>
						<input
							type="text"
							id="projectName"
							bind:value={name}
							placeholder="Misal: Peluncuran Produk Q4"
							class="input input-bordered w-full border-emerald-200 bg-white focus:border-emerald-400 focus:ring focus:ring-emerald-100"
							required
						/>
					</div>
					<div class="grid gap-2">
						<label
							class="text-sm font-semibold uppercase tracking-wide text-emerald-900"
							for="organizationId">Organisasi</label
						>
						<select
							id="organizationId"
							bind:value={organizationId}
							class="select select-bordered w-full border-emerald-200 bg-white focus:border-emerald-400 focus:ring focus:ring-emerald-100"
						>
							<option value="">Tanpa organisasi (opsional)</option>
							{#each data.organizations as org (org.id)}
								<option value={org.id}>{org.name}</option>
							{/each}
						</select>

						<p class="text-xs text-emerald-700/70">
							Hubungkan proyek ke organisasi supaya akses dan izin anggota lebih mudah diatur.
						</p>
					</div>
					<div
						class="flex flex-col gap-3 border-t border-emerald-100 pt-6 text-sm text-emerald-800/80"
					>
						<div class="flex items-center gap-3">
							<span class="text-lg">✨</span>
							<span>Papan proyek otomatis dilengkapi status default yang bisa kamu sesuaikan.</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="text-lg">🤝</span>
							<span>Undang anggota tim setelah membuat proyek agar langsung bisa kolaborasi.</span>
						</div>
					</div>
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
						<a href="/project" class="btn btn-ghost text-emerald-600 hover:bg-emerald-100">Batal</a>
						<button
							type="submit"
							class="btn btn-primary bg-emerald-600 border-none hover:bg-emerald-500"
						>
							Buat Proyek
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
