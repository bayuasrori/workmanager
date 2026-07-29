<script lang="ts">
	import { getPaymentGateways, createPaymentGateway } from './data.remote';
	import { updatePaymentGateway, deletePaymentGateway } from './[id]/data.remote';

	const PROVIDERS = ['custom', 'manual', 'stripe', 'paypal', 'adyen', 'razorpay', 'sumopod'];
	const STATUSES = ['inactive', 'test', 'active'];

	type GatewayRow = {
		id: string;
		name: string;
		provider: string;
		status: string;
		credentials: Record<string, unknown> | null;
		webhookSecret: string | null;
	};

	const data = $derived(await getPaymentGateways({}));
	const gateways = $derived((data as { gateways?: GatewayRow[] }).gateways ?? []);

	let showForm = $state(false);
	let form = $state({
		name: '',
		provider: 'sumopod',
		status: 'test',
		apiKey: '',
		webhookSecret: '',
		baseUrl: ''
	});

	const resetForm = () => {
		form = {
			name: '',
			provider: 'sumopod',
			status: 'test',
			apiKey: '',
			webhookSecret: '',
			baseUrl: ''
		};
	};

	const submit = async () => {
		try {
			await createPaymentGateway({
				name: form.name,
				provider: form.provider,
				status: form.status,
				credentials: {
					apiKey: form.apiKey,
					...(form.baseUrl ? { baseUrl: form.baseUrl } : {})
				},
				webhookSecret: form.webhookSecret || null
			}).updates(getPaymentGateways({}));
			showForm = false;
			resetForm();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal menyimpan gateway.');
		}
	};

	const setStatus = async (id: string, status: string) => {
		try {
			await updatePaymentGateway({ gatewayId: id, status }).updates(getPaymentGateways({}));
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal update status.');
		}
	};

	const remove = async (id: string) => {
		if (!confirm('Hapus gateway ini?')) return;
		try {
			await deletePaymentGateway({ gatewayId: id }).updates(getPaymentGateways({}));
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal menghapus.');
		}
	};
</script>

<svelte:head><title>Admin · Payment Gateways</title></svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Payment Gateways</h1>
		<button
			class="btn btn-primary btn-sm"
			onclick={() => {
				resetForm();
				showForm = !showForm;
			}}
		>
			{showForm ? 'Tutup' : '+ Gateway Baru'}
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
			<label class="form-control">
				<span class="label-text mb-1">Nama</span>
				<input
					class="input input-bordered input-sm"
					bind:value={form.name}
					placeholder="SumoPod (Sandbox)"
				/>
			</label>
			<label class="form-control">
				<span class="label-text mb-1">Provider</span>
				<select class="select select-bordered select-sm" bind:value={form.provider}>
					{#each PROVIDERS as p (p)}<option value={p}>{p}</option>{/each}
				</select>
			</label>
			<label class="form-control">
				<span class="label-text mb-1">API Key</span>
				<input
					class="input input-bordered input-sm font-mono"
					bind:value={form.apiKey}
					placeholder="033a9d..."
				/>
			</label>
			<label class="form-control">
				<span class="label-text mb-1">Webhook Secret (whsec_…)</span>
				<input
					class="input input-bordered input-sm font-mono"
					bind:value={form.webhookSecret}
					placeholder="opsional, bisa via env"
				/>
			</label>
			<label class="form-control">
				<span class="label-text mb-1">Base URL (override)</span>
				<input
					class="input input-bordered input-sm font-mono"
					bind:value={form.baseUrl}
					placeholder="kosong = default/env"
				/>
			</label>
			<label class="form-control">
				<span class="label-text mb-1">Status awal</span>
				<select class="select select-bordered select-sm" bind:value={form.status}>
					{#each STATUSES as s (s)}<option value={s}>{s}</option>{/each}
				</select>
			</label>
			<div class="sm:col-span-2 flex gap-2">
				<button type="submit" class="btn btn-primary btn-sm">Buat</button>
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
				<tr
					><th>Nama</th><th>Provider</th><th>Status</th><th>API Key</th><th>Webhook</th><th
					></th></tr
				>
			</thead>
			<tbody>
				{#each gateways as g (g.id)}
					<tr>
						<td>{g.name}</td>
						<td class="font-mono text-xs">{g.provider}</td>
						<td>
							<select
								class="select select-bordered select-xs capitalize"
								value={g.status}
								onchange={(e) => setStatus(g.id, (e.currentTarget as HTMLSelectElement).value)}
							>
								{#each STATUSES as s (s)}<option value={s} selected={s === g.status}>{s}</option>{/each}
							</select>
						</td>
						<td class="text-xs"
							>{(g.credentials as Record<string, unknown>)?.apiKey ? '✓ ter-set' : '— (env)'}</td
						>
						<td class="text-xs">{g.webhookSecret ? '✓ ter-set' : '— (env)'}</td>
						<td
							><button class="btn btn-ghost btn-xs text-error" onclick={() => remove(g.id)}
								>Hapus</button
							></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="alert alert-info mt-4 text-sm">
		Webhook secret & API key boleh dikosongkan di sini — provider otomatis fallback ke env (<code
			>PAPANIN_PAYMENT_SUMOPOD_*</code
		>). Webhook URL:
		<code>/api/webhooks/payment/&#123;provider&#125;</code>
	</div>
</div>
