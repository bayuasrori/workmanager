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

	const data = $derived(await getNotesImportData({ projectId: selectedProjectId || undefined }));
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
			if (drafts.length === 0) toasts.info('Tidak ada task terdeteksi dari catatan.');
			else toasts.success(`${drafts.length} draft task siap direview.`);
		} catch (error) {
			console.error('Parse gagal', error);
			toasts.error('Gagal mem-parsing catatan. Periksa konfigurasi LLM / coba lagi.');
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
	<header class="mb-6">
		<h1 class="text-3xl font-bold text-base-content">Impor Tugas dari Catatan</h1>
		<p class="text-sm text-base-content/70 mt-1">
			Tempel notulensi rapat / catatan. LLM mengekstrak aksi item jadi draft task — review, lalu buat.
		</p>
	</header>

	<section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm space-y-4">
		<div class="grid gap-4 md:grid-cols-2">
			<label class="form-control">
				<span class="label-text font-semibold mb-1">Proyek tujuan</span>
				<select
					class="select select-bordered"
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
			</label>
			{#if selectedProjectId}
				<label class="form-control">
					<span class="label-text font-semibold mb-1">Status tujuan default (opsional)</span>
					<select
						class="select select-bordered"
						value={defaultStatusName}
						onchange={(e) =>
							(defaultStatusName = (e.currentTarget as HTMLSelectElement).value)}
					>
						<option value="">— Ikut hasil LLM —</option>
						{#each statuses as s (s.id)}
							<option value={s.name}>{s.name}</option>
						{/each}
					</select>
					<span class="text-xs text-base-content/60 mt-1">
						Kalau dipilih, semua task hasil parse di-set ke status ini (bisa diubah per-task di review).
					</span>
				</label>
			{/if}
		</div>

		{#if selectedProjectId}
			<div class="text-xs text-base-content/60 space-y-1">
				<p><span class="font-semibold">Anggota:</span> {members.map((m) => m.username).join(', ') || '(kosong)'}</p>
			</div>
		{/if}

		<label class="form-control">
			<span class="label-text font-semibold mb-1">Catatan / notulensi</span>
			<textarea
				class="textarea textarea-bordered min-h-[12rem]"
				placeholder="Tempel notulensi rapat di sini…"
				bind:value={notes}
			></textarea>
		</label>

		<div class="flex items-center gap-3">
			<button class="btn btn-primary" onclick={handleParse} disabled={parsing || !selectedProjectId}>
				{#if parsing}
					<span class="loading loading-spinner loading-sm"></span>
					Memparsing…
				{:else}
					Parse dgn LLM
				{/if}
			</button>
			{#if drafts.length > 0}
				<button class="btn btn-success" onclick={handleCreate} disabled={creating}>
					{#if creating}
						<span class="loading loading-spinner loading-sm"></span>
						Membuat…
					{:else}
						Buat {drafts.length} task
					{/if}
				</button>
			{/if}
		</div>
	</section>

	{#if drafts.length > 0}
		<section class="mt-6 space-y-3">
			<h2 class="text-lg font-semibold text-base-content">
				Draft task ({drafts.length}) — review sebelum dibuat
			</h2>
			{#each drafts as draft (draft._id)}
				<div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm space-y-3">
					<div class="flex items-start gap-2">
						<input
							class="input input-bordered flex-1 font-semibold"
							bind:value={draft.title}
							placeholder="Judul task"
						/>
						<button class="btn btn-ghost btn-sm text-error" onclick={() => removeDraft(draft._id)}>
							Hapus
						</button>
					</div>
					<input
						class="input input-bordered w-full text-sm"
						bind:value={draft.description}
						placeholder="Deskripsi (opsional)"
					/>
					<div class="grid gap-3 md:grid-cols-4">
						<label class="form-control">
							<span class="label-text text-xs mb-1">Status</span>
							<select
								class="select select-bordered select-sm"
								value={draft.statusName}
								onchange={(e) => patchDraft(draft._id, { statusName: (e.currentTarget as HTMLSelectElement).value })}
							>
								<option value="">— tanpa status —</option>
								{#each statuses as s (s.id)}
									<option value={s.name}>{s.name}</option>
								{/each}
							</select>
						</label>
						<label class="form-control">
							<span class="label-text text-xs mb-1">Assignee</span>
							<select
								class="select select-bordered select-sm"
								value={draft.assigneeName}
								onchange={(e) => patchDraft(draft._id, { assigneeName: (e.currentTarget as HTMLSelectElement).value })}
							>
								<option value="">— tanpa assignee —</option>
								{#each members as m (m.id)}
									<option value={m.username}>{m.username}</option>
								{/each}
							</select>
						</label>
						<label class="form-control">
							<span class="label-text text-xs mb-1">Mulai</span>
							<input
								type="date"
								class="input input-bordered input-sm"
								bind:value={draft.startDate}
							/>
						</label>
						<label class="form-control">
							<span class="label-text text-xs mb-1">Tenggat</span>
							<input
								type="date"
								class="input input-bordered input-sm"
								bind:value={draft.dueDate}
							/>
						</label>
					</div>
				</div>
			{/each}
		</section>
	{/if}
</div>
