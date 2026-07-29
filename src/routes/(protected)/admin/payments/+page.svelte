<script lang="ts">
	import { getAdminPayments, refundPayment } from './data.remote';

	const data = $derived(await getAdminPayments());

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

	const statusBadge = (status: string) =>
		(
			({
				succeeded: 'badge-success',
				pending: 'badge-warning',
				failed: 'badge-error',
				refunded: 'badge-ghost'
			}) as Record<string, string>
		)[status] ?? 'badge-ghost';

	const refund = async (id: string) => {
		if (!confirm('Refund pembayaran ini (set status refunded)?')) return;
		try {
			await refundPayment({ paymentId: id }).updates(getAdminPayments());
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal refund.');
		}
	};
</script>

<svelte:head><title>Admin · Payments</title></svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="text-2xl font-bold mb-4">Pembayaran</h1>
	<div class="overflow-x-auto rounded-box border border-base-300">
		<table class="table table-sm">
			<thead>
				<tr>
					<th>Invoice</th><th>Produk</th><th>User</th><th>Gateway</th>
					<th class="text-right">Jumlah</th><th>Status</th><th>Tanggal</th><th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.payments as p (p.id)}
					<tr>
						<td class="font-mono text-xs">{p.invoiceNumber ?? '-'}</td>
						<td>
							{#if p.gatewayProvider === 'sumopod' && p.productType === 'topup'}Topup {p.creditsPurchased}
								AI
							{:else}{(p.membershipTypeId ?? '-').toUpperCase()}{#if p.seatsPurchased}
									({p.seatsPurchased} seat){/if}{/if}
						</td>
						<td class="font-mono text-xs">{p.userId.slice(0, 8)}</td>
						<td>{p.gatewayName ?? p.gatewayProvider ?? '-'}</td>
						<td class="text-right">{formatIDR(p.amount)}</td>
						<td
							><span class="badge {statusBadge(p.status)} badge-sm capitalize">{p.status}</span></td
						>
						<td class="text-xs">{formatDate(p.createdAt)}</td>
						<td class="whitespace-nowrap">
							<a class="link link-hover text-xs" href="/billing/invoice/{p.id}">detail</a>
							{#if p.status === 'succeeded'}
								<button class="btn btn-ghost btn-xs text-warning ml-1" onclick={() => refund(p.id)}
									>refund</button
								>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
