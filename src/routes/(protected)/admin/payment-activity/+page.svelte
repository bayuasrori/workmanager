<script lang="ts">
	import Chart from '$lib/components/Chart.svelte';
	import type { PageData } from './$types';

	const props = $props<{ data: PageData }>();
	const data = $derived(props.data);

	const formatCurrency = (value: string | number | null | undefined, currency = 'USD') => {
		const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value ?? 0;
		if (!Number.isFinite(numericValue)) {
			return `${currency} 0.00`;
		}
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency
		}).format(numericValue);
	};

	const formatDateTime = (value: string | Date | null | undefined) => {
		if (!value) {
			return '-';
		}
		const date = value instanceof Date ? value : new Date(value);
		return date.toLocaleString();
	};

	const statusLabels: Record<string, string> = {
		succeeded: 'Succeeded',
		pending: 'Pending',
		failed: 'Failed'
	};

	const cardMetric = (label: string, value: string, hint?: string) => ({ label, value, hint });

	const summaryMetrics = $derived.by(() => [
		cardMetric('Total Revenue', formatCurrency(data.revenueSummary.total_revenue)),
		cardMetric('Pending Value', formatCurrency(data.revenueSummary.pending_value)),
		cardMetric('Successful Payments', data.revenueSummary.successful_payments.toString()),
		cardMetric('Failed Payments', data.revenueSummary.failed_payments.toString())
	]);

	type ChartConfig = {
		labels: string[];
		datasets: Array<Record<string, unknown>>;
	};

	const revenueTrendChartData = $derived.by<ChartConfig | null>(() => {
		if (data.monthlyRevenue.length === 0) {
			return null;
		}

		return {
			labels: data.monthlyRevenue.map((entry) => entry.month),
			datasets: [
				{
					label: 'Revenue',
					data: data.monthlyRevenue.map((entry) => Number.parseFloat(entry.revenue)),
					borderColor: 'rgb(34, 197, 94)',
					backgroundColor: 'rgba(34, 197, 94, 0.25)',
					tension: 0.25,
					fill: true
				}
			]
		};
	});

	const statusBreakdownChartData = $derived.by<ChartConfig | null>(() => {
		if (data.statusBreakdown.length === 0) {
			return null;
		}

		return {
			labels: data.statusBreakdown.map((entry) => statusLabels[entry.status] ?? entry.status),
			datasets: [
				{
					label: 'Payments',
					backgroundColor: [
						'rgba(34, 197, 94, 0.6)',
						'rgba(251, 191, 36, 0.6)',
						'rgba(248, 113, 113, 0.6)'
					],
					borderColor: [
						'rgba(34, 197, 94, 1)',
						'rgba(251, 191, 36, 1)',
						'rgba(248, 113, 113, 1)'
					],
					borderWidth: 1,
					data: data.statusBreakdown.map((entry) => entry.count)
				}
			]
		};
	});

	const gatewayContributionChartData = $derived.by<ChartConfig | null>(() => {
		if (data.gatewayContribution.length === 0) {
			return null;
		}

		const labels = data.gatewayContribution.map((entry) => entry.name ?? entry.provider ?? 'Unknown');
		const revenues = data.gatewayContribution.map((entry) => Number.parseFloat(entry.revenue));
		return {
			labels,
			datasets: [
				{
					label: 'Gateway Revenue',
					backgroundColor: 'rgba(59, 130, 246, 0.6)',
					borderColor: 'rgba(59, 130, 246, 1)',
					borderWidth: 1,
					data: revenues
				}
			]
		};
	});

	const gatewayPerformanceChartData = $derived.by<ChartConfig | null>(() => {
		if (data.gatewayPerformance.length === 0) {
			return null;
		}

		const labels = data.gatewayPerformance.map((entry) => entry.name ?? entry.provider);
		return {
			labels,
			datasets: [
				{
					label: 'Succeeded',
					backgroundColor: 'rgba(34, 197, 94, 0.7)',
					data: data.gatewayPerformance.map((entry) => entry.successful_payments)
				},
				{
					label: 'Failed',
					backgroundColor: 'rgba(248, 113, 113, 0.7)',
					data: data.gatewayPerformance.map((entry) => entry.failed_payments)
				}
			]
		};
	});
</script>

<div class="space-y-8">
	<div>
		<h1 class="text-2xl font-semibold">Payment Activity</h1>
		<p class="text-sm text-base-content/70">Overview of recent payments, gateway performance, and revenue trends.</p>
	</div>

	<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each summaryMetrics as metric}
			<div class="rounded-lg border border-base-300 bg-base-200 p-4 shadow-sm">
				<p class="text-sm font-medium text-base-content/70">{metric.label}</p>
				<p class="mt-2 text-2xl font-semibold text-base-content">{metric.value}</p>
				{#if metric.hint}
					<p class="mt-1 text-xs text-base-content/60">{metric.hint}</p>
				{/if}
			</div>
		{/each}
	</section>

	<section class="grid gap-6 lg:grid-cols-2">
		<div class="rounded-lg border border-base-300 bg-base-200 p-4">
			<h2 class="text-lg font-semibold">Revenue Trend</h2>
			<p class="text-sm text-base-content/70">Monthly revenue for the last six months.</p>
			<div class="mt-4 h-64">
				{#if revenueTrendChartData}
					<Chart type="line" data={revenueTrendChartData} options={{ responsive: true, maintainAspectRatio: false }} />
				{:else}
					<p class="text-sm text-base-content/60">No revenue data available.</p>
				{/if}
			</div>
		</div>

		<div class="rounded-lg border border-base-300 bg-base-200 p-4">
			<h2 class="text-lg font-semibold">Status Breakdown</h2>
			<p class="text-sm text-base-content/70">Distribution of payment statuses.</p>
			<div class="mt-4 h-64">
				{#if statusBreakdownChartData}
					<Chart type="doughnut" data={statusBreakdownChartData} options={{ responsive: true, maintainAspectRatio: false }} />
				{:else}
					<p class="text-sm text-base-content/60">No status data available.</p>
				{/if}
			</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-2">
		<div class="rounded-lg border border-base-300 bg-base-200 p-4">
			<h2 class="text-lg font-semibold">Gateway Contribution</h2>
			<p class="text-sm text-base-content/70">Revenue generated per gateway.</p>
			<div class="mt-4 h-64">
				{#if gatewayContributionChartData}
					<Chart type="bar" data={gatewayContributionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
				{:else}
					<p class="text-sm text-base-content/60">No gateway contribution data available.</p>
				{/if}
			</div>
		</div>

		<div class="rounded-lg border border-base-300 bg-base-200 p-4">
			<h2 class="text-lg font-semibold">Gateway Performance (30d)</h2>
			<p class="text-sm text-base-content/70">Success vs. failure counts for the past month.</p>
			<div class="mt-4 h-64">
				{#if gatewayPerformanceChartData}
					<Chart type="bar" data={gatewayPerformanceChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
				{:else}
					<p class="text-sm text-base-content/60">No gateway performance data available.</p>
				{/if}
			</div>
		</div>
	</section>

	<section class="rounded-lg border border-base-300 bg-base-200 p-4">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold">Recent Payments</h2>
				<p class="text-sm text-base-content/70">Latest 20 payment records with gateway context.</p>
			</div>
			<p class="text-xs text-base-content/60">Active gateways: {data.activeGateways.length}</p>
		</div>

		<div class="mt-4 overflow-x-auto">
			<table class="min-w-full divide-y divide-base-300">
				<thead>
					<tr class="text-left text-xs font-semibold uppercase tracking-wide text-base-content/70">
						<th class="px-3 py-2">User</th>
						<th class="px-3 py-2">Gateway</th>
						<th class="px-3 py-2">Amount</th>
						<th class="px-3 py-2">Status</th>
						<th class="px-3 py-2">Created</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-base-300 text-sm">
					{#if data.recentPayments.length === 0}
						<tr>
							<td class="px-3 py-4 text-base-content/60" colspan="5">No payments found.</td>
						</tr>
					{:else}
						{#each data.recentPayments as payment}
							<tr class="hover:bg-base-300/40">
								<td class="px-3 py-3 font-mono text-xs">{payment.userId}</td>
								<td class="px-3 py-3">
									<div class="flex flex-col">
										<span class="text-sm font-medium">{payment.gatewayName ?? '—'}</span>
										<span class="text-xs text-base-content/60">{payment.gatewayProvider ?? 'unknown'}</span>
									</div>
								</td>
								<td class="px-3 py-3">{formatCurrency(payment.amount, payment.currency)}</td>
								<td class="px-3 py-3">
									<span class="rounded-full bg-base-300 px-2 py-1 text-xs font-medium uppercase">{statusLabels[payment.status] ?? payment.status}</span>
								</td>
								<td class="px-3 py-3 text-xs text-base-content/70">{formatDateTime(payment.createdAt)}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</section>

	<section class="rounded-lg border border-base-300 bg-base-200 p-4">
		<h2 class="text-lg font-semibold">Recent Failures</h2>
		<p class="text-sm text-base-content/70">Troubleshoot the latest failed payments.</p>

		<div class="mt-4 overflow-x-auto">
			<table class="min-w-full divide-y divide-base-300">
				<thead>
					<tr class="text-left text-xs font-semibold uppercase tracking-wide text-base-content/70">
						<th class="px-3 py-2">Payment</th>
						<th class="px-3 py-2">Amount</th>
						<th class="px-3 py-2">Error</th>
						<th class="px-3 py-2">Updated</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-base-300 text-sm">
					{#if data.recentFailures.length === 0}
						<tr>
							<td class="px-3 py-4 text-base-content/60" colspan="4">No failures recorded.</td>
						</tr>
					{:else}
						{#each data.recentFailures as failure}
							<tr class="hover:bg-base-300/40">
								<td class="px-3 py-3 font-mono text-xs">{failure.id}</td>
								<td class="px-3 py-3">{formatCurrency(failure.amount, failure.currency)}</td>
								<td class="px-3 py-3">
									<div class="flex flex-col gap-1">
										<span class="text-xs font-semibold text-error">{failure.errorCode ?? 'Unknown error'}</span>
										<span class="text-xs text-base-content/70">{failure.errorMessage ?? 'No message provided.'}</span>
									</div>
								</td>
								<td class="px-3 py-3 text-xs text-base-content/70">{formatDateTime(failure.updatedAt)}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</section>
</div>
