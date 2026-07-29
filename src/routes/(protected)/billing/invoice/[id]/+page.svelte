<script lang="ts">
	import { page } from '$app/stores';

	const data = $derived($page.data);
	const payment = $derived(data.payment);
	const plan = $derived(data.plan);

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
		return d.toLocaleString('id-ID');
	};

	const meta = $derived(
		(payment.metadata ?? {}) as {
			fee?: number | null;
			netAmount?: number | null;
			providerStatus?: string | null;
			paymentMethod?: string | null;
			paymentLinkUrl?: string | null;
			membershipActivatedId?: string | null;
		}
	);

	const statusBadge = (status: string) =>
		({
			succeeded: 'badge-success',
			pending: 'badge-warning',
			failed: 'badge-error',
			refunded: 'badge-ghost'
		})[status] ?? 'badge-ghost';
</script>

<svelte:head><title>Invoice {payment.invoiceNumber ?? payment.id}</title></svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Invoice</h1>
		<span class="badge {statusBadge(payment.status)} capitalize">{payment.status}</span>
	</div>

	<div class="card mt-4 bg-base-100 border border-base-200 shadow-md">
		<div class="card-body">
			<dl class="grid grid-cols-2 gap-y-2 text-sm">
				<dt class="opacity-60">No. Invoice</dt>
				<dd class="font-mono">{payment.invoiceNumber ?? '-'}</dd>
				<dt class="opacity-60">Tanggal</dt>
				<dd>{formatDate(payment.createdAt)}</dd>
				<dt class="opacity-60">Plan</dt>
				<dd class="capitalize">{plan?.name ?? payment.membershipTypeId ?? '-'}</dd>
				<dt class="opacity-60">Metode</dt>
				<dd class="capitalize">{meta.paymentMethod ?? '-'}</dd>
				<dt class="opacity-60">Status Gateway</dt>
				<dd>{meta.providerStatus ?? '-'}</dd>
			</dl>

			<hr class="my-4 border-base-200" />

			<div class="space-y-1 text-sm">
				<div class="flex justify-between">
					<span class="opacity-60">Subtotal</span>
					<span>{formatIDR(payment.amount)}</span>
				</div>
				{#if meta.fee !== null && meta.fee !== undefined}
					<div class="flex justify-between">
						<span class="opacity-60">Fee Gateway</span>
						<span>- {formatIDR(meta.fee)}</span>
					</div>
				{/if}
				{#if meta.netAmount !== null && meta.netAmount !== undefined}
					<div class="flex justify-between font-semibold">
						<span>Net Diterima</span>
						<span>{formatIDR(meta.netAmount)}</span>
					</div>
				{/if}
			</div>

			{#if payment.status === 'pending' && meta.paymentLinkUrl}
				<div class="mt-4 card-actions justify-end">
					<a
						class="btn btn-primary btn-sm"
						href={meta.paymentLinkUrl}
						target="_blank"
						rel="noopener"
					>
						Lanjutkan Pembayaran
					</a>
				</div>
			{/if}
			{#if payment.status === 'succeeded' && meta.membershipActivatedId}
				<div class="alert alert-success mt-4 py-2 text-sm">Membership telah diaktifkan.</div>
			{/if}
		</div>
	</div>

	<div class="mt-4 text-center">
		<a class="link link-hover text-sm" href="/billing">← Kembali ke Billing</a>
	</div>
</div>
