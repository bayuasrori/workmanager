<script lang="ts">
	import { getBillingData, createPayment, buyAiTopup } from './data.remote';

	const data = $derived(await getBillingData());

	let redirecting = $state<{ kind: 'plan' | 'topup'; id: string } | null>(null);
	let errorMsg = $state<string | null>(null);
	let teamSeats = $state(3);

	const formatIDR = (value: string | number | null | undefined) => {
		const n = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0);
		if (!Number.isFinite(n)) return 'Rp 0';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(n);
	};

	const formatDate = (value: string | Date | null | undefined) => {
		if (!value) return '-';
		const d = value instanceof Date ? value : new Date(value);
		return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	};

	const statusBadge = (status: string) =>
		(
			({
				succeeded: 'badge-success',
				pending: 'badge-warning',
				failed: 'badge-error',
				refunded: 'badge-ghost'
			}) as Record<string, string>
		)[status] ?? 'badge-ghost';

	const payablePlans = $derived(data.plans.filter((p) => Number(p.price ?? 0) > 0));

	const aiRemainingMonthly = $derived(Math.max(0, data.ai.monthlyAllowance - data.ai.monthlyUsed));

	const buyPlan = async (planId: string, isTeam: boolean) => {
		errorMsg = null;
		redirecting = { kind: 'plan', id: planId };
		try {
			const result = await createPayment({
				membershipTypeId: planId,
				seats: isTeam ? teamSeats : undefined
			});
			if (result.paymentLinkUrl) window.location.href = result.paymentLinkUrl;
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Gagal membuat pembayaran.';
			redirecting = null;
		}
	};

	const buyTopup = async (packId: string) => {
		errorMsg = null;
		redirecting = { kind: 'topup', id: packId };
		try {
			const result = await buyAiTopup({ packId });
			if (result.paymentLinkUrl) window.location.href = result.paymentLinkUrl;
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Gagal membuat pembayaran.';
			redirecting = null;
		}
	};
</script>

<svelte:head><title>Billing</title></svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<h1 class="text-2xl font-bold">Billing</h1>

	{#if data.activeMembership}
		<div class="alert alert-success mt-4">
			<div>
				<div class="font-semibold">
					Membership aktif: {data.activeMembership.membershipTypeId.toUpperCase()}{#if data.activeMembership.isTrial}
						(Trial){/if}
				</div>
				<div class="text-sm opacity-80">
					Berakhir {formatDate(data.activeMembership.endDate)}{#if data.activeMembership.seats}
						· {data.activeMembership.seats} seat{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="alert mt-4">
			<div>
				<div class="font-semibold">Belum ada membership berbayar</div>
				<div class="text-sm opacity-80">Pilih plan di bawah untuk berlangganan.</div>
			</div>
		</div>
	{/if}

	<!-- AI quota -->
	<div class="card mt-4 bg-base-100 border border-base-200 shadow-sm">
		<div class="card-body">
			<div class="flex items-center justify-between">
				<h2 class="card-title text-base">Kredit AI</h2>
				<span class="text-sm opacity-60"
					>{aiRemainingMonthly}/{data.ai.monthlyAllowance} bulan ini · topup: {data.ai
						.topupBalance}</span
				>
			</div>
			<progress
				class="progress progress-primary w-full"
				value={data.ai.monthlyUsed}
				max={data.ai.monthlyAllowance}
			></progress>
		</div>
	</div>

	{#if errorMsg}
		<div class="alert alert-error mt-4">{errorMsg}</div>
	{/if}

	<!-- Plans -->
	<section class="mt-8">
		<h2 class="mb-4 text-lg font-semibold">Pilih Plan</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each payablePlans as plan (plan.id)}
				<div class="card bg-base-100 shadow-md border border-base-200">
					<div class="card-body">
						<h3 class="card-title capitalize">{plan.name}</h3>
						<p class="text-sm opacity-70">{plan.description ?? ''}</p>
						<div class="mt-2 text-2xl font-bold">
							{formatIDR(plan.price)}
							<span class="text-sm font-normal opacity-60"
								>/{plan.durationMonths} bln{#if plan.id === 'team'}/seat{/if}</span
							>
						</div>

						{#if plan.id === 'team'}
							<label class="mt-2 flex items-center gap-2 text-sm">
								Seat
								<input
									type="number"
									class="input input-bordered input-sm w-24"
									min="3"
									bind:value={teamSeats}
								/>
								<span class="opacity-60"
									>× {formatIDR(plan.price)} = {formatIDR(Number(plan.price) * teamSeats)}</span
								>
							</label>
						{/if}

						<div class="mt-4 card-actions justify-end">
							<button
								type="button"
								class="btn btn-primary btn-sm"
								onclick={() => buyPlan(plan.id, plan.id === 'team')}
								disabled={redirecting !== null}
							>
								{#if redirecting?.kind === 'plan' && redirecting.id === plan.id}
									<span class="loading loading-spinner loading-xs"></span> Memproses...
								{:else}
									Beli
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- AI topup packs -->
	<section class="mt-10">
		<h2 class="mb-1 text-lg font-semibold">Topup Kredit AI</h2>
		<p class="mb-4 text-sm opacity-60">
			Dipakai setelah kuota bulanan habis. Berlaku semua plan, tidak expire.
		</p>
		<div class="grid gap-4 sm:grid-cols-3">
			{#each data.topupPacks as pack (pack.id)}
				<div class="card bg-base-100 shadow-sm border border-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">{pack.credits} kredit</h3>
						<div class="text-xl font-bold">{formatIDR(pack.price)}</div>
						<div class="mt-3 card-actions justify-end">
							<button
								type="button"
								class="btn btn-outline btn-sm"
								onclick={() => buyTopup(pack.id)}
								disabled={redirecting !== null}
							>
								{#if redirecting?.kind === 'topup' && redirecting.id === pack.id}
									<span class="loading loading-spinner loading-xs"></span>...
								{:else}
									Beli
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- History -->
	<section class="mt-10">
		<h2 class="mb-4 text-lg font-semibold">Riwayat Invoice</h2>
		{#if data.payments.length === 0}
			<div class="text-sm opacity-60">Belum ada pembayaran.</div>
		{:else}
			<div class="overflow-x-auto rounded-box border border-base-300">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Invoice</th>
							<th>Produk</th>
							<th class="text-right">Jumlah</th>
							<th>Status</th>
							<th>Tanggal</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.payments as p (p.id)}
							<tr>
								<td class="font-mono text-xs">{p.invoiceNumber ?? '-'}</td>
								<td
									>{p.productType === 'topup'
										? `Topup ${p.creditsPurchased ?? ''} AI`
										: (p.membershipTypeId ?? '-').toUpperCase()}{#if p.seatsPurchased}
										({p.seatsPurchased} seat){/if}</td
								>
								<td class="text-right">{formatIDR(p.amount)}</td>
								<td
									><span class="badge {statusBadge(p.status)} badge-sm capitalize">{p.status}</span
									></td
								>
								<td>{formatDate(p.createdAt)}</td>
								<td><a class="link link-hover text-xs" href="/billing/invoice/{p.id}">Detail</a></td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
