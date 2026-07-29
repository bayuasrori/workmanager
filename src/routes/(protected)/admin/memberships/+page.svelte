<script lang="ts">
	import { grantMembership, getAdminMemberships, revokeMembership } from './data.remote';

	const data = $derived(await getAdminMemberships());

	let grantUserId = $state('');
	let grantPlan = $state('pro');
	let grantMonths = $state(1);
	let grantSeats = $state(3);
	let grantOpen = $state(false);
	let feedback = $state<string | null>(null);
	let query_ = $state('');

	const filtered = $derived(
		query_.trim()
			? data.rows.filter(
					(r) =>
						r.username.toLowerCase().includes(query_.toLowerCase()) ||
						r.email.toLowerCase().includes(query_.toLowerCase())
				)
			: data.rows
	);

	const formatDate = (value: string | Date | null | undefined) => {
		if (!value) return '-';
		const d = value instanceof Date ? value : new Date(value);
		return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	};

	const planBadge = (plan: string, isTrial: boolean) =>
		isTrial ? 'badge-warning' : plan === 'free' ? 'badge-ghost' : 'badge-success';

	const submitGrant = async () => {
		if (!grantUserId) {
			alert('Pilih user dulu.');
			return;
		}
		try {
			const user = data.rows.find((r) => r.id === grantUserId);
			await grantMembership({
				userId: grantUserId,
				membershipTypeId: grantPlan,
				durationMonths: grantMonths,
				seats: grantPlan === 'team' ? grantSeats : undefined
			}).updates(getAdminMemberships());
			feedback = `✓ Grant ${grantPlan.toUpperCase()} (${grantMonths} bln) ke "${user?.username ?? grantUserId}" berhasil.`;
			grantUserId = '';
		} catch (err) {
			feedback = null;
			alert(err instanceof Error ? err.message : 'Gagal grant.');
		}
	};

	// Tombol Grant cepat per-baris: buka form + isi user + scroll.
	const quickGrant = (userId: string) => {
		grantUserId = userId;
		grantOpen = true;
		feedback = null;
		queueMicrotask(() => {
			document.getElementById('grant-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	const revoke = async (userId: string) => {
		if (!confirm('Cabut membership aktif user ini? (kembali ke free)')) return;
		try {
			await revokeMembership({ userId }).updates(getAdminMemberships());
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Gagal revoke.');
		}
	};
</script>

<svelte:head><title>Admin · Memberships</title></svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="text-2xl font-bold">Memberships</h1>
	<p class="text-sm opacity-60 mt-1">
		Pantau plan user & grant membership (partner/eksternal, tanpa pembayaran).
	</p>

	{#if feedback}
		<div class="alert alert-success mt-4 py-2 text-sm">{feedback}</div>
	{/if}

	<!-- Grant form -->
	<details
		id="grant-card"
		class="collapse collapse-arrow bg-base-100 border border-base-200 mt-4"
		bind:open={grantOpen}
	>
		<summary class="collapse-title font-semibold">Grant Membership</summary>
		<div class="collapse-content">
			<form
				class="grid gap-3 sm:grid-cols-5 items-end"
				onsubmit={(e) => {
					e.preventDefault();
					submitGrant();
				}}
			>
				<label class="form-control sm:col-span-2">
					<span class="label-text mb-1">User</span>
					<select class="select select-bordered select-sm" bind:value={grantUserId}>
						<option value="" disabled selected>Pilih user…</option>
						{#each data.rows as r (r.id)}
							<option value={r.id}>{r.username} — {r.email}</option>
						{/each}
					</select>
				</label>
				<label class="form-control">
					<span class="label-text mb-1">Plan</span>
					<select class="select select-bordered select-sm" bind:value={grantPlan}>
						{#each data.types as t (t.id)}
							<option value={t.id}>{t.id}</option>
						{/each}
					</select>
				</label>
				<label class="form-control">
					<span class="label-text mb-1">Durasi (bln)</span>
					<input
						type="number"
						class="input input-bordered input-sm"
						min="1"
						bind:value={grantMonths}
					/>
				</label>
				<label class="form-control">
					<span class="label-text mb-1"
						>Seat {#if grantPlan !== 'team'}(n/a){/if}</span
					>
					<input
						type="number"
						class="input input-bordered input-sm"
						min="1"
						bind:value={grantSeats}
						disabled={grantPlan !== 'team'}
					/>
				</label>
				<div class="sm:col-span-5">
					<button type="submit" class="btn btn-primary btn-sm">Grant</button>
					<span class="text-xs opacity-50 ml-2"
						>Grant menandai membership sbg non-trial (berlaku penuh).</span
					>
				</div>
			</form>
		</div>
	</details>

	<!-- Search -->
	<div class="mt-4 flex items-center gap-2">
		<input
			class="input input-bordered input-sm w-full max-w-xs"
			placeholder="Cari user…"
			bind:value={query_}
		/>
		<span class="text-xs opacity-50">{filtered.length} user</span>
	</div>

	<!-- Table -->
	<div class="overflow-x-auto rounded-box border border-base-300 mt-3">
		<table class="table table-sm">
			<thead>
				<tr>
					<th>User</th><th>Email</th><th>Plan</th><th>Trial?</th><th>Seat</th><th>Berakhir</th><th
					></th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as r (r.id)}
					<tr>
						<td>
							{r.username}
							{#if r.isAdmin}<span class="badge badge-xs badge-info ml-1">admin</span>{/if}
						</td>
						<td class="text-xs">{r.email}</td>
						<td>
							{#if r.membership}
								<span
									class="badge {planBadge(
										r.membership.plan,
										r.membership.isTrial
									)} badge-sm capitalize">{r.membership.plan}</span
								>
							{:else}
								<span class="text-xs opacity-50">free (default)</span>
							{/if}
						</td>
						<td
							>{#if r.membership?.isTrial}<span class="text-warning text-xs">trial</span
								>{:else}-{/if}</td
						>
						<td>{r.membership?.seats ?? '-'}</td>
						<td class="text-xs">{r.membership ? formatDate(r.membership.endDate) : '-'}</td>
						<td>
							{#if r.membership}
								<button class="btn btn-ghost btn-xs text-error" onclick={() => revoke(r.id)}
									>Revoke</button
								>
							{:else}
								<button class="btn btn-ghost btn-xs" onclick={() => quickGrant(r.id)}>Grant</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
