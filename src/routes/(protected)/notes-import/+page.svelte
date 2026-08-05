<script lang="ts">
	import { goto } from '$app/navigation';
	import { getNotesImportData, parseNotes, createTasksFromDrafts } from './data.remote';
	import { toasts } from '$lib/toast.svelte';

	type Draft = {
		_id: string;
		title: string;
		description?: string;
		assigneeName?: string;
		statusName?: string;
		startDate?: string;
		dueDate?: string;
	};

	let selectedProjectId = $state('');
	let defaultStatusName = $state('');
	let notes = $state('');
	let drafts = $state<Draft[]>([]);
	let parsing = $state(false);
	let creating = $state(false);
	
	// Mode: 1 = Input Notulensi, 2 = Review Draft
	let step = $state<1 | 2>(1);

	const notesQuery = $derived(getNotesImportData({ projectId: selectedProjectId || undefined }));
	const data = $derived(await notesQuery);

	// Gabungkan status dari server dengan nama status yang diajukan AI (yang mungkin belum ada di proyek kosong).
	const reviewStatuses = $derived.by(() => {
		const existing = statuses.map((s) => s.name);
		const proposed = drafts
			.map((d) => d.statusName?.trim())
			.filter((n): n is string => !!n && !existing.includes(n));
		return [...statuses, ...proposed.map((n) => ({ id: n, name: n }))];
	});

	const projects = $derived(data?.projects ?? []);
	const statuses = $derived(data?.statuses ?? []);
	const members = $derived(data?.members ?? []);

	// Trim an ISO/loose date string to YYYY-MM-DD for <input type="date">.
	const toDateInput = (value?: string) => {
		if (!value) return '';
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return '';
		const tz = d.getTimezoneOffset() * 60000;
		return new Date(d.getTime() - tz).toISOString().slice(0, 10);
	};

	function patchDraft(id: string, patch: Partial<Draft>) {
		drafts = drafts.map((d) => (d._id === id ? { ...d, ...patch } : d));
	}

	async function handleParse() {
		if (!selectedProjectId) {
			toasts.error('Pilih proyek dulu.');
			return;
		}
		if (!notes.trim()) {
			toasts.error('Catatan tidak boleh kosong.');
			return;
		}
		parsing = true;
		drafts = [];
		try {
			const result = await parseNotes({ projectId: selectedProjectId, notes });
			drafts = result.map((d) => ({
				_id: crypto.randomUUID(),
				title: d.title,
				description: d.description ?? '',
				assigneeName: d.assigneeName ?? '',
				// Default ke status tujuan terpilih (override hasil LLM) bila dipilih.
				statusName: defaultStatusName || d.statusName || '',
				startDate: toDateInput(d.startDate),
				dueDate: toDateInput(d.dueDate)
			}));
			if (drafts.length === 0) {
				toasts.info('Tidak ada task terdeteksi dari catatan.');
			} else {
				toasts.success(`${drafts.length} draft task siap direview.`);
				step = 2; // Pindah ke langkah review
			}
		} catch (error: any) {
			console.error('Parse gagal', error);
			const msg = error?.body?.message || error?.message || 'Gagal mem-parsing catatan.';
			toasts.error(msg);
		} finally {
			parsing = false;
		}
	}

	function removeDraft(id: string) {
		drafts = drafts.filter((d) => d._id !== id);
	}

	async function handleCreate() {
		if (!selectedProjectId || drafts.length === 0 || creating) return;
		creating = true;
		try {
			const { created } = await createTasksFromDrafts({
				projectId: selectedProjectId,
				drafts: drafts.map(({ _id, ...rest }) => {
					void _id;
					return rest;
				})
			}).updates(getNotesImportData({ projectId: selectedProjectId }));
			toasts.success(`${created} task berhasil dibuat.`);
			goto(`/project/${selectedProjectId}/tasks`);
		} catch (error) {
			console.error('Create gagal', error);
			toasts.error('Gagal membuat task. Silakan coba lagi.');
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>Papanin — Impor Tugas dari Catatan</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-5xl">
	<header class="mb-6 flex items-start justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Impor Tugas dari Catatan</h1>
			<p class="text-sm text-base-content/70 mt-1">
				Tempel notulensi rapat / catatan. LLM mengekstrak aksi item jadi draft task — review, lalu buat.
			</p>
		</div>
		{#if data?.hasAiFeature}
			<div class="text-right">
				<div class="badge {data.aiRemaining > 0 ? 'badge-primary' : 'badge-error'} font-semibold">
					{data.aiRemaining} kredit AI tersisa
				</div>
				{#if data.aiRemaining === 0}
					<div class="text-xs text-error mt-1">
						<a href="/billing" class="underline hover:text-error/80">Beli topup</a>
					</div>
				{/if}
			</div>
		{:else}
			<div class="badge badge-warning">AI tidak didukung di plan ini</div>
		{/if}
	</header>

	<div class="mb-10 w-full">
		<ul class="steps steps-horizontal w-full">
			<li class="step {step >= 1 ? 'step-primary' : ''} font-medium">Tempel Notulensi</li>
			<li class="step {step >= 2 ? 'step-primary' : ''} font-medium">Review & Buat</li>
		</ul>
	</div>

	{#if step === 1}
		<section class="relative rounded-2xl border border-base-300/60 bg-base-100/50 backdrop-blur-xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
			<!-- Subtle background gradient glow -->
			<div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
			<div class="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
			
			<div class="grid lg:grid-cols-3 gap-8 relative z-10">
				<!-- Kolom Kiri: Konfigurasi -->
				<div class="space-y-6 flex flex-col">
					<div>
						<h3 class="text-lg font-bold text-base-content mb-1">Pengaturan</h3>
						<p class="text-sm text-base-content/60">Tentukan di mana tugas-tugas ini akan disimpan.</p>
					</div>

					<label class="form-control w-full">
						<span class="label-text font-semibold text-base-content/90 mb-2">Proyek Tujuan</span>
						<select
							class="select select-bordered bg-base-100/80 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm w-full"
							value={selectedProjectId}
							onchange={(e) => {
								selectedProjectId = (e.currentTarget as HTMLSelectElement).value;
								defaultStatusName = '';
							}}
						>
							<option value="">— Pilih proyek —</option>
							{#each projects as p (p.id)}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
						{#if selectedProjectId}
							<div class="mt-3 bg-base-200/50 p-3 rounded-lg border border-base-300/50">
								<span class="text-xs font-semibold text-base-content/70 block mb-1">Anggota Proyek:</span>
								<span class="text-xs text-base-content/60 flex items-start gap-1.5">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
										<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
									</svg>
									{members.map((m) => m.username).join(', ') || 'Belum ada anggota'}
								</span>
							</div>
						{/if}
					</label>

					<div class="flex-grow">
						{#if selectedProjectId}
							<label class="form-control w-full animate-in fade-in zoom-in-95 duration-300">
								<span class="label-text font-semibold text-base-content/90 mb-2">Status Tujuan Default <span class="text-base-content/50 font-normal ml-1 text-xs">(opsional)</span></span>
								<select
									class="select select-bordered bg-base-100/80 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm w-full"
									value={defaultStatusName}
									onchange={(e) =>
										(defaultStatusName = (e.currentTarget as HTMLSelectElement).value)}
								>
									<option value="">— Biarkan AI Menentukan —</option>
									{#each statuses as s (s.id)}
										<option value={s.name}>{s.name}</option>
									{/each}
								</select>
								<span class="text-xs text-base-content/60 mt-2 block">
									Otomatis set status ke kolom ini untuk semua tugas yang terdeteksi.
								</span>
							</label>
						{/if}
					</div>
				</div>

				<!-- Kolom Kanan: Editor (span 2) -->
				<div class="lg:col-span-2 flex flex-col min-h-[400px]">
					<label class="form-control flex-grow flex flex-col h-full relative">
						<div class="flex items-center justify-between mb-2">
							<span class="label-text font-semibold text-base-content/90">Isi Notulensi Rapat</span>
							<span class="badge badge-sm badge-outline border-primary/30 text-primary bg-primary/5 font-medium gap-1 px-2">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
								  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM10 12.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" clip-rule="evenodd" />
								</svg>
								AI-Powered
							</span>
						</div>
						<textarea
							class="textarea textarea-bordered w-full h-full min-h-[300px] flex-grow text-base leading-relaxed bg-base-100/80 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm resize-y"
							placeholder="Ketik atau tempel notulensi rapat di sini...&#10;&#10;Contoh:&#10;- Budi tolong siapkan presentasi untuk Q3 minggu depan.&#10;- Rina akan memperbaiki bug login besok."
							bind:value={notes}
						></textarea>
					</label>

					<div class="flex items-center justify-end pt-4 mt-auto">
						<button 
							class="btn btn-primary px-10 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl" 
							onclick={handleParse} 
							disabled={parsing || !selectedProjectId || !notes.trim()}
						>
							{#if parsing}
								<span class="loading loading-spinner loading-sm"></span>
								Menganalisa Catatan...
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
								</svg>
								Ekstrak Tugas
							{/if}
						</button>
					</div>
				</div>
			</div>
		</section>
	{/if}

	{#if step === 2 && drafts.length > 0}
		<section class="relative rounded-2xl border border-base-300/60 bg-base-100/50 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden mt-4">
			<!-- Subtle background gradient glow -->
			<div class="absolute -top-24 -left-24 w-64 h-64 bg-success/5 rounded-full blur-3xl pointer-events-none"></div>

			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
				<div>
					<h2 class="text-xl font-bold text-base-content flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-success" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
						Review {drafts.length} Tugas
					</h2>
					<p class="text-sm text-base-content/60 mt-1">
						Pastikan detail tugas di bawah sudah benar. Klik pada teks untuk mengubahnya.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<button class="btn btn-ghost hover:bg-base-200 transition-colors rounded-xl" onclick={() => (step = 1)} disabled={creating}>
						Kembali
					</button>
					<button class="btn btn-success px-8 shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl" onclick={handleCreate} disabled={creating}>
						{#if creating}
							<span class="loading loading-spinner loading-sm"></span>
							Menyimpan...
						{:else}
							Buat {drafts.length} Tugas
						{/if}
					</button>
				</div>
			</div>

			<div class="overflow-x-auto rounded-xl border border-base-200 bg-base-100/40 shadow-inner relative z-10">
				<table class="table w-full">
					<thead class="bg-base-200/40 text-base-content/80 text-sm">
						<tr>
							<th class="font-semibold">Judul & Deskripsi</th>
							<th class="w-48 font-semibold">Status</th>
							<th class="w-48 font-semibold">Assignee</th>
							<th class="w-36 font-semibold">Mulai</th>
							<th class="w-36 font-semibold">Tenggat</th>
							<th class="w-12"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-base-200/60">
						{#each drafts as draft (draft._id)}
							<tr class="group hover:bg-base-100/60 transition-colors">
								<td class="align-top py-3">
									<input
										class="input input-sm input-ghost w-full font-semibold text-base focus:bg-base-100 focus:shadow-sm transition-all mb-1 px-1 h-8"
										bind:value={draft.title}
										placeholder="Judul task..."
									/>
									<input
										class="input input-xs input-ghost w-full text-base-content/60 focus:bg-base-100 focus:shadow-sm transition-all px-1"
										bind:value={draft.description}
										placeholder="Tambahkan deskripsi (opsional)..."
									/>
								</td>
								<td class="align-top py-3">
									<select
										class="select select-ghost select-sm w-full text-sm focus:bg-base-100 focus:shadow-sm transition-all px-1 h-8"
										value={draft.statusName}
										onchange={(e) => patchDraft(draft._id, { statusName: (e.currentTarget as HTMLSelectElement).value })}
									>
										<option value="">— Kosong —</option>
										{#each reviewStatuses as s (s.id)}
											<option value={s.name}>{s.name}</option>
										{/each}
									</select>
								</td>
								<td class="align-top py-3">
									<select
										class="select select-ghost select-sm w-full text-sm focus:bg-base-100 focus:shadow-sm transition-all px-1 h-8"
										value={draft.assigneeName}
										onchange={(e) => patchDraft(draft._id, { assigneeName: (e.currentTarget as HTMLSelectElement).value })}
									>
										<option value="">— Kosong —</option>
										{#each members as m (m.id)}
											<option value={m.username}>{m.username}</option>
										{/each}
									</select>
								</td>
								<td class="align-top py-3">
									<input
										type="date"
										class="input input-ghost input-sm w-full text-sm focus:bg-base-100 focus:shadow-sm transition-all px-1 h-8"
										bind:value={draft.startDate}
									/>
								</td>
								<td class="align-top py-3">
									<input
										type="date"
										class="input input-ghost input-sm w-full text-sm focus:bg-base-100 focus:shadow-sm transition-all px-1 h-8"
										bind:value={draft.dueDate}
									/>
								</td>
								<td class="align-top py-3 text-right">
									<button 
										class="btn btn-ghost btn-square btn-sm text-error/70 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all" 
										onclick={() => removeDraft(draft._id)}
										title="Hapus baris ini"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				{#if drafts.length === 0}
					<div class="p-8 text-center text-base-content/50">
						Tidak ada draft tugas. Silakan kembali ke langkah pertama.
					</div>
				{/if}
			</div>
		</section>
	{/if}
</div>
