<script lang="ts">
	import {
		getMembershipTypes,
		createMembershipType,
		updateMembershipType,
		deleteMembershipType
	} from './data.remote';

	const data = $derived(await getMembershipTypes());

	let showForm = $state(false);
	let editId = $state<string | null>(null);
	let form = $state({
		id: '',
		name: 'pro',
		description: '',
		price: 0,
		currency: 'IDR',
		durationMonths: 1,
		isDefault: false,
		limits: null as Record<string, unknown> | null,
		features: {} as Record<string, boolean>
	});

	const formatIDR = (value: string | number | null | undefined) => {
		const n = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0);
		if (!Number.isFinite(n)) return 'Rp 0';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(n);
	};

	const resetForm = () => {
		form = {
			id: '',
			name: 'pro',
			description: '',
			price: 0,
			currency: 'IDR',
			durationMonths: 1,
			isDefault: false,
			limits: null,
			features: {}
		};
		editId = null;
	};

	const startEdit = (t: (typeof data.types)[number]) => {
		editId = t.id;
		form = {
			id: t.id,
			name: t.name,
			description: t.description ?? '',
			price: Number(t.price ?? 0),
			currency: t.currency ?? 'IDR',
			durationMonths: t.durationMonths ?? 1,
			isDefault: t.isDefault ?? false,
			limits: t.limits as Record<string, unknown> | null ?? null,
			features: ((t.limits as Record<string, unknown> | null)?.features as Record<string, boolean>) ?? {}
		};
		showForm = true;
	};

	const submit = async () => {
		const limits =
			form.limits || Object.keys(form.features).length > 0
				? {
						...(form.limits ?? {}),
						features: form.features
					}
				: undefined;
		try {
			if (editId) {
				await updateMembershipType({
					id: editId,
					description: form.description,
					price: form.price,
					currency: form.currency,
					durationMonths: form.durationMonths,
					isDefault: form.isDefault,
					limits
				}).updates(getMembershipTypes());
			} else {
				await createMembershipType({ ...form, limits }).updates(getMembershipTypes());
			}
			showForm = false;
			resetForm();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal menyimpan plan.');
		}
	};

	const remove = async (id: string) => {
		if (!confirm(`Hapus plan "${id}"?`)) return;
		try {
			await deleteMembershipType({ id }).updates(getMembershipTypes());
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal menghapus.');
		}
	};
</script>

<svelte:head><title>Admin · Plan</title></svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Plan & Harga</h1>
		<button
			class="btn btn-primary btn-sm"
			onclick={() => {
				resetForm();
				showForm = !showForm;
			}}
		>
			{showForm ? 'Tutup' : '+ Plan Baru'}
		</button>
	</div>

	{#if showForm}
		<form
			class="card bg-base-100 border border-base-200 shadow-sm mt-4 p-4 grid gap-3 sm:grid-cols-2"
			onsubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			{#if !editId}
				<label class="form-control">
					<span class="label-text mb-1">ID</span>
					<input
						class="input input-bordered input-sm"
						bind:value={form.id}
						placeholder="pro / team / custom"
					/>
				</label>
				<label class="form-control">
					<span class="label-text mb-1">Name (enum)</span>
					<select class="select select-bordered select-sm" bind:value={form.name}>
						<option value="free">free</option>
						<option value="pro">pro</option>
						<option value="team">team</option>
					</select>
				</label>
			{/if}
			<label class="form-control">
				<span class="label-text mb-1">Harga ({form.currency})</span>
				<input type="number" class="input input-bordered input-sm" bind:value={form.price} />
			</label>
			<label class="form-control">
				<span class="label-text mb-1">Currency</span>
				<input class="input input-bordered input-sm" maxlength="3" bind:value={form.currency} />
			</label>
			<label class="form-control">
				<span class="label-text mb-1">Durasi (bulan)</span>
				<input
					type="number"
					class="input input-bordered input-sm"
					bind:value={form.durationMonths}
				/>
			</label>
			<label class="form-control">
				<span class="label-text mb-1">Default?</span>
				<input type="checkbox" class="toggle toggle-sm" bind:checked={form.isDefault} />
			</label>
			<label class="form-control sm:col-span-2">
				<span class="label-text mb-1">Deskripsi</span>
				<input class="input input-bordered input-sm" bind:value={form.description} />
			</label>

			<!-- Batasan plan (limits) -->
			<details class="sm:col-span-2 border border-base-300 rounded-box p-3">
				<summary class="cursor-pointer text-sm font-semibold">Batasan Plan (opsional)</summary>
				<div class="grid grid-cols-2 gap-3 mt-3">
					{#each ['maxProjects','maxTasksPerProject','maxOrgMembers','storageMb','aiMonthly','activityHistoryDays','maxIntegrations'] as key}
						<label class="form-control">
							<span class="label-text mb-1 text-xs">{key}</span>
							<input
								type="number"
								class="input input-bordered input-xs"
								placeholder="(default)"
								value={(form.limits?.[key] ?? '') as number}
								oninput={(e) => {
									const v = (e.target as HTMLInputElement).value;
									if (!form.limits) form.limits = {};
									form.limits[key] = v === '' ? (null as unknown as undefined) : Number(v);
								}}
							/>
						</label>
					{/each}
				</div>
				<div class="divider text-xs my-2">Fitur</div>
				<div class="flex flex-wrap gap-3">
					{#each ['ai','aiAutomation','publicBoard','timelineFull','customStatus','export','integrations','customBranding'] as feat}
						<label class="flex items-center gap-1 text-xs">
							<input
								type="checkbox"
								class="checkbox checkbox-xs"
								checked={form.features[feat] ?? false}
								onchange={(e) => {
									form.features[feat] = (e.target as HTMLInputElement).checked;
								}}
							/>{feat}</label
						>
					{/each}
				</div>
			</details>

			<div class="sm:col-span-2 flex gap-2">
				<button type="submit" class="btn btn-primary btn-sm">{editId ? 'Update' : 'Buat'}</button>
				<button
					type="button"
					class="btn btn-ghost btn-sm"
					onclick={() => {
						showForm = false;
						resetForm();
					}}>Batal</button
				>
			</div>
		</form>
	{/if}

	<div class="overflow-x-auto rounded-box border border-base-300 mt-4">
		<table class="table table-sm">
			<thead>
				<tr>
					<th>ID</th><th>Name</th><th class="text-right">Harga</th><th>Durasi</th><th>Default</th
					><th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.types as t (t.id)}
					<tr>
						<td class="font-mono">{t.id}</td>
						<td class="capitalize">{t.name}</td>
						<td class="text-right"
							>{formatIDR(t.price)} <span class="text-xs opacity-50">/{t.currency}</span></td
						>
						<td>{t.durationMonths} bln</td>
						<td
							>{#if t.isDefault}<span class="badge badge-xs badge-success">default</span>{/if}</td
						>
						<td class="whitespace-nowrap">
							<button class="btn btn-ghost btn-xs" onclick={() => startEdit(t)}>Edit</button>
							{#if t.id !== 'free'}<button
									class="btn btn-ghost btn-xs text-error"
									onclick={() => remove(t.id)}>Hapus</button
								>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
