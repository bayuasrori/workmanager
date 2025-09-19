<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let projectMembers = data?.projectMembers ?? [];
	let availableUsers = data?.availableUsers ?? [];

	$: projectMembers = data?.projectMembers ?? [];
	$: availableUsers = data?.availableUsers ?? [];
</script>

<div class="min-h-[70vh] bg-gradient-to-br from-emerald-50 via-emerald-100 to-amber-50 py-10">
	<div class="mx-auto w-full max-w-6xl px-4">
		<div class="mb-8 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Pengaturan proyek</p>
			<h1 class="mt-2 text-4xl font-extrabold text-emerald-900">{data.project.name}</h1>
			<p class="mt-3 text-base text-emerald-800/70">
				Perbarui detail proyek dan atur siapa saja yang dapat berkolaborasi di dalamnya.
			</p>
		</div>
		<div class="grid gap-6 lg:grid-cols-5">
			<section class="lg:col-span-3">
				<div class="card border border-emerald-200/70 bg-white/90 shadow-2xl backdrop-blur">
					<div class="card-body p-8">
						<h2 class="text-xl font-bold text-emerald-900">Detail Proyek</h2>
						<p class="text-sm text-emerald-700/70">Informasi ini membantu anggota tim memahami ruang kerja.</p>
						<form method="POST" action="?/updateProject" class="mt-6 grid gap-6">
							<div class="grid gap-2">
								<label
									class="text-sm font-semibold uppercase tracking-wide text-emerald-900"
									for="projectName"
								>
									Nama Proyek
								</label>
								<input
									type="text"
									name="name"
									id="projectName"
									value={data.project.name}
									placeholder="Misal: Sprint Onboarding"
									class="input input-bordered w-full border-emerald-200 focus:border-emerald-400 focus:ring focus:ring-emerald-100"
									required
								/>
							</div>
							<div class="grid gap-2">
								<label
									class="text-sm font-semibold uppercase tracking-wide text-emerald-900"
									for="organizationId"
								>
									Organisasi
								</label>
								<select
									name="organizationId"
									id="organizationId"
									class="select select-bordered w-full border-emerald-200 focus:border-emerald-400 focus:ring focus:ring-emerald-100"
								>
									<option value="" selected={!data.project.organizationId}>
										Tanpa organisasi (opsional)
									</option>
									{#each data.organizations as org (org.id)}
										<option value={org.id} selected={org.id === data.project.organizationId}>
											{org.name}
										</option>
									{/each}
								</select>
								<p class="text-xs text-emerald-700/70">
									Pilih organisasi untuk membatasi akses proyek hanya bagi anggotanya.
								</p>
							</div>
							<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
								<a href="/project" class="btn btn-ghost text-emerald-600 hover:bg-emerald-100">Kembali</a>
								<button
									type="submit"
									class="btn btn-primary border-none bg-emerald-600 hover:bg-emerald-500"
								>
									Simpan Perubahan
								</button>
							</div>
						</form>
					</div>
				</div>
			</section>
			<section class="lg:col-span-2">
				<div class="space-y-6">
					<div class="card border border-emerald-200/70 bg-white/90 shadow-xl backdrop-blur">
						<div class="card-body p-6">
							<h2 class="text-lg font-bold text-emerald-900">Anggota Proyek</h2>
							<p class="text-sm text-emerald-700/70">
								Kelola siapa saja yang dapat melihat dan mengupdate tugas di proyek ini.
							</p>
								{#if projectMembers.length}
									<ul class="mt-4 space-y-3">
										{#each projectMembers as member (member.userId)}
										<li class="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 px-4 py-3">
											<div>
												<p class="text-sm font-semibold text-emerald-900">{member.username ?? member.email}</p>
												<p class="text-xs text-emerald-700/70">{member.email}</p>
											</div>
											<form method="POST" action="?/removeMember" class="shrink-0">
												<input type="hidden" name="userId" value={member.userId} />
												<button
													type="submit"
													class="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50"
												>
													Hapus
												</button>
											</form>
										</li>
									{/each}
								</ul>
							{:else}
								<div class="mt-4 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-sm text-emerald-700/70">
									Belum ada anggota pada proyek ini.
								</div>
							{/if}
						</div>
					</div>
					<div class="card border border-emerald-200/70 bg-white/90 shadow-xl backdrop-blur">
						<div class="card-body p-6">
							<h3 class="text-lg font-bold text-emerald-900">Tambah Anggota</h3>
							<p class="text-sm text-emerald-700/70">
								Pilih pengguna untuk bergabung. Mereka akan langsung memiliki akses ke papan tugas proyek ini.
							</p>
							<form method="POST" action="?/addMember" class="mt-4 space-y-4">
								<div class="grid gap-2">
									<label class="text-xs font-semibold uppercase tracking-wide text-emerald-900" for="memberId"
										>Pengguna</label
									>
									<select
										name="userId"
										id="memberId"
										class="select select-bordered w-full border-emerald-200 focus:border-emerald-400 focus:ring focus:ring-emerald-100"
										required
									>
										<option value="" disabled selected>Pilih pengguna...</option>
										{#if availableUsers.length}
											{#each availableUsers as user (user.id)}
												<option value={user.id}>{user.username ?? user.email}</option>
											{/each}
										{:else}
											<option value="" disabled>Semua pengguna sudah menjadi anggota</option>
										{/if}
									</select>
								</div>
								<button
									type="submit"
									class="btn btn-primary w-full border-none bg-emerald-600 hover:bg-emerald-500"
										disabled={!availableUsers.length}
								>
									Tambahkan
								</button>
							</form>
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>
