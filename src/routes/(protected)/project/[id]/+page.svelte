<script lang="ts">
	import type { PageData } from './$types';
	import { updateProject, addMember, removeMember, deleteTaskStatus, getProjectData } from './data.remote';

	let { data }: { data: PageData } = $props();

	// Reactive state
	let project = $state(data.project);
	let projectMembers = $state(data.projectMembers);
	let availableUsers = $state(data.availableUsers);
	let taskStatuses = $state(data.taskStatuses);

	// Form states
	let projectName = $state(data.project.name);
	let organizationId = $state(data.project.organizationId ?? '');
	let selectedUserId = $state('');

	// Loading states
	let isUpdatingProject = $state(false);
	let isAddingMember = $state(false);
	let isRemovingMember = $state(new Set<string>());
	let isDeletingStatus = $state(new Set<string>());

	// Update project
	async function handleUpdateProject(event: Event) {
		event.preventDefault();
		if (!projectName.trim()) return;

		isUpdatingProject = true;
		try {
			await updateProject({
				projectId: project.id,
				name: projectName,
				organizationId: organizationId || undefined
			});
			project.name = projectName;
			project.organizationId = organizationId || null;
			alert('Proyek berhasil diperbarui!');
		} catch (error) {
			console.error('Failed to update project', error);
			alert('Gagal memperbarui proyek. Silakan coba lagi.');
		} finally {
			isUpdatingProject = false;
		}
	}

	// Add member
	async function handleAddMember(event: Event) {
		event.preventDefault();
		if (!selectedUserId) return;

		isAddingMember = true;
		try {
			await addMember({
				projectId: project.id,
				userId: selectedUserId
			});

			// Refresh data using remote function
			const result = await getProjectData({ projectId: project.id });
			projectMembers = result.projectMembers;
			availableUsers = result.availableUsers;
			selectedUserId = '';
			alert('Anggota berhasil ditambahkan!');
		} catch (error) {
			console.error('Failed to add member', error);
			alert('Gagal menambahkan anggota. Silakan coba lagi.');
		} finally {
			isAddingMember = false;
		}
	}

	// Remove member
	async function handleRemoveMember(userId: string, username?: string) {
		if (!confirm(`Hapus ${username || 'anggota'} dari proyek ini?`)) return;

		isRemovingMember.add(userId);
		try {
			await removeMember({
				projectId: project.id,
				userId
			});

			// Refresh data using remote function
			const result = await getProjectData({ projectId: project.id });
			projectMembers = result.projectMembers;
			availableUsers = result.availableUsers;
		} catch (error) {
			console.error('Failed to remove member', error);
			alert('Gagal menghapus anggota. Silakan coba lagi.');
		} finally {
			isRemovingMember.delete(userId);
		}
	}

	// Delete task status
	async function handleDeleteTaskStatus(statusId: string, statusName: string) {
		if (!confirm(`Hapus status "${statusName}"? Tugas dengan status ini tidak akan dihapus.`)) return;

		isDeletingStatus.add(statusId);
		try {
			await deleteTaskStatus({ statusId });
			taskStatuses = taskStatuses.filter(s => s.id !== statusId);
		} catch (error) {
			console.error('Failed to delete task status', error);
			alert('Gagal menghapus status. Silakan coba lagi.');
		} finally {
			isDeletingStatus.delete(statusId);
		}
	}
</script>

<div class="min-h-[70vh] bg-gradient-to-br from-emerald-50 via-emerald-100 to-amber-50 py-10">
	<div class="mx-auto w-full max-w-6xl px-4">
		<div class="mb-8 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Pengaturan proyek</p>
			<h1 class="mt-2 text-4xl font-extrabold text-emerald-900">{project.name}</h1>
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
						<form onsubmit={handleUpdateProject} class="mt-6 grid gap-6">
							<div class="grid gap-2">
								<label
									class="text-sm font-semibold uppercase tracking-wide text-emerald-900"
									for="projectName"
								>
									Nama Proyek
								</label>
								<input
									type="text"
									bind:value={projectName}
									id="projectName"
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
									bind:value={organizationId}
									id="organizationId"
									class="select select-bordered w-full border-emerald-200 focus:border-emerald-400 focus:ring focus:ring-emerald-100"
								>
									<option value="">Tanpa organisasi (opsional)</option>
									{#each data.organizations as org (org.id)}
										<option value={org.id}>{org.name}</option>
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
									disabled={isUpdatingProject}
								>
									{#if isUpdatingProject}
										<span class="loading loading-spinner loading-sm"></span>
										Menyimpan...
									{:else}
										Simpan Perubahan
									{/if}
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
											<button
												type="button"
												class="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
												disabled={isRemovingMember.has(member.userId)}
												onclick={() => handleRemoveMember(member.userId, member.username ?? member.email)}
											>
												{#if isRemovingMember.has(member.userId)}
													<span class="loading loading-spinner loading-xs"></span>
												{:else}
													Hapus
												{/if}
											</button>
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
							<form onsubmit={handleAddMember} class="mt-4 space-y-4">
								<div class="grid gap-2">
									<label class="text-xs font-semibold uppercase tracking-wide text-emerald-900" for="memberId"
										>Pengguna</label
									>
									<select
										bind:value={selectedUserId}
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
									class="btn btn-primary w-full border-none bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={!availableUsers.length || isAddingMember}
								>
									{#if isAddingMember}
										<span class="loading loading-spinner loading-sm"></span>
										Menambahkan...
									{:else}
										Tambahkan
									{/if}
								</button>
							</form>
						</div>
					</div>
					<div class="card border border-emerald-200/70 bg-white/90 shadow-xl backdrop-blur">
						<div class="card-body p-6">
							<h2 class="text-lg font-bold text-emerald-900">Status Tugas</h2>
							<p class="text-sm text-emerald-700/70">
								Kelola status tugas di proyek ini.
							</p>
							{#if taskStatuses.length}
								<ul class="mt-4 space-y-3">
									{#each taskStatuses as status (status.id)}
										<li class="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 px-4 py-3">
											<div>
												<p class="text-sm font-semibold text-emerald-900">{status.name}</p>
											</div>
											<button
												type="button"
												class="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
												disabled={isDeletingStatus.has(status.id)}
												onclick={() => handleDeleteTaskStatus(status.id, status.name)}
											>
												{#if isDeletingStatus.has(status.id)}
													<span class="loading loading-spinner loading-xs"></span>
												{:else}
													Hapus
												{/if}
											</button>
										</li>
									{/each}
								</ul>
							{:else}
								<div class="mt-4 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-sm text-emerald-700/70">
									Belum ada status pada proyek ini.
								</div>
							{/if}
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>