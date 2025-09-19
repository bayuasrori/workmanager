<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let projects = data?.projects ?? [];
	$: projects = data?.projects ?? [];
	const totalProjects = () => projects.length;
	const formatOrg = (orgId: string | null) => orgId ?? 'Tidak terhubung';

	const confirmDelete = (event: Event) => {
		if (!confirm('Hapus proyek ini? Semua data terkait tidak dapat dikembalikan.')) {
			event.preventDefault();
		}
	};
</script>

<div class="min-h-[70vh] bg-gradient-to-br from-emerald-50 via-emerald-100 to-amber-50 py-10">
	<div class="mx-auto w-full max-w-6xl px-4">
		<header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Proyek saya</p>
				<h1 class="mt-2 text-4xl font-extrabold text-emerald-900">Kelola Proyek</h1>
				<p class="mt-2 text-sm text-emerald-800/70">
					Pantau semua proyek yang kamu ikuti dan buka papan tugasnya kapan saja.
				</p>
			</div>
			<a
				href="/project/create"
				class="btn btn-primary border-none bg-emerald-600 px-6 text-base shadow-lg hover:bg-emerald-500"
			>
				+ Buat Proyek Baru
			</a>
		</header>

		{#if totalProjects()}
			<section class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_2fr)]">
				<div class="card border border-emerald-200/70 bg-white/90 shadow-2xl backdrop-blur">
					<div class="card-body gap-3 p-6">
						<h2 class="text-sm font-semibold uppercase tracking-wide text-emerald-900">Ringkasan</h2>
						<div class="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-6 text-center">
							<p class="text-sm font-medium text-emerald-700">Total Proyek Aktif</p>
							<p class="mt-2 text-5xl font-extrabold text-emerald-900">{totalProjects()}</p>
						</div>
						<ul class="mt-4 space-y-3 text-sm text-emerald-700/80">
							<li class="flex items-center gap-3">
								<span class="text-lg">🗂️</span>
								<span>Gunakan tombol "Buat Proyek Baru" untuk memulai ruang kerja baru.</span>
							</li>
							<li class="flex items-center gap-3">
								<span class="text-lg">👥</span>
								<span>Kelola anggota proyek dari halaman detail proyek.</span>
							</li>
							<li class="flex items-center gap-3">
								<span class="text-lg">📝</span>
								<span>Buka papan tugas untuk memantau progres dan pembagian kerja.</span>
							</li>
						</ul>
					</div>
				</div>
				<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{#each projects as project (project.id)}
						<article class="group card border border-emerald-200/60 bg-white/90 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
							<div class="card-body gap-4 p-6">
								<div class="flex items-start justify-between gap-3">
									<div>
										<h2 class="text-xl font-semibold text-emerald-900">{project.name}</h2>
										<p class="text-xs uppercase tracking-wide text-emerald-700/70">ID: {project.slug}</p>
									</div>

								</div>
								<div class="text-sm text-emerald-700/80">
									<p>Masuk ke papan tugas atau ubah pengaturan proyek ini.</p>
								</div>
								<div class="mt-auto flex flex-wrap gap-2">
									<a
										href="/project/{project.id}/tasks"
										class="btn btn-sm border-none bg-emerald-600 text-white hover:bg-emerald-500"
									>
										Lihat Tugas
									</a>
									<a href="/project/{project.id}" class="btn btn-sm btn-ghost text-emerald-700 hover:bg-emerald-100">
										Atur Proyek
									</a>
									<form method="POST" action="?/delete&id={project.id}" on:submit={confirmDelete} class="contents">
										<button type="submit" class="btn btn-sm btn-outline border-rose-200 text-rose-600 hover:bg-rose-50">
											Hapus
										</button>
									</form>
								</div>
							</div>
						</article>
					{/each}
				</div>
			</section>
		{:else}
			<section class="mt-12">
				<div class="card border border-dashed border-emerald-200 bg-white/90 py-12 text-center shadow-xl">
					<div class="mx-auto max-w-md space-y-4">
						<h2 class="text-2xl font-bold text-emerald-900">Belum ada proyek</h2>
						<p class="text-sm text-emerald-700/80">
							Mulai satu proyek untuk merapikan kerja tim. Kamu bisa mengundang anggota, menambahkan
								status, dan membuat tugas di papan kanban.
						</p>
						<a
							href="/project/create"
							class="btn btn-primary border-none bg-emerald-600 px-6 hover:bg-emerald-500"
						>
							Buat Proyek Pertama
						</a>
					</div>
				</div>
			</section>
		{/if}
	</div>
</div>
