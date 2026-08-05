<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Tab aktif: 'send' atau 'verify'
	let activeTab = $state<'send' | 'verify'>('send');

	// Override SMTP fields — default dari env yang di-load server
	let overrideHost = $state(data.smtp.host);
	let overridePort = $state(String(data.smtp.port));
	let overrideUser = $state(data.smtp.user);
	let overridePass = $state('');
	let overrideFrom = $state(data.smtp.from);
	let overrideFromName = $state(data.smtp.fromName);
	let showPassword = $state(false);
	let showOverride = $state(false);

	// Test email fields
	let toAddr = $state('');
	let subject = $state('Test Email dari Papanin Admin');
	let body = $state('Halo! Ini adalah email test dari Papanin Admin.\n\nJika kamu menerima ini, konfigurasi SMTP berfungsi dengan baik. ✅');

	let loading = $state(false);

	const statusBadge = (ok: boolean) =>
		ok
			? 'badge badge-success badge-sm gap-1'
			: 'badge badge-error badge-sm gap-1';
</script>

<svelte:head><title>Admin · SMTP Test</title></svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8 space-y-6">

	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold">SMTP Test</h1>
			<p class="text-base-content/60 text-sm mt-1">
				Verifikasi koneksi email dan kirim test email dari panel admin.
			</p>
		</div>
		<!-- Status konfigurasi env -->
		<div class="flex flex-col items-end gap-1 text-xs">
			<span class={statusBadge(data.smtp.configured)}>
				{#if data.smtp.configured}✓ SMTP ter-konfigurasi{:else}⚠ SMTP belum diset{/if}
			</span>
			<span class="text-base-content/40">
				Provider: <code>{data.smtp.provider}</code>
			</span>
		</div>
	</div>

	<!-- Env info card -->
	<div class="card bg-base-200 p-4 text-sm space-y-1">
		<div class="font-semibold text-base-content/70 mb-2">Konfigurasi dari ENV</div>
		<div class="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
			<span class="text-base-content/50">HOST</span>
			<span>{#if data.smtp.host}{data.smtp.host}{:else}<em class="text-warning not-italic">tidak diset</em>{/if}</span>
			<span class="text-base-content/50">PORT</span>
			<span>{data.smtp.port}</span>
			<span class="text-base-content/50">USER</span>
			<span>{#if data.smtp.user}{data.smtp.user}{:else}<em class="text-warning not-italic">tidak diset</em>{/if}</span>
			<span class="text-base-content/50">PASS</span>
			<span>{#if data.smtp.configured}••••••••{:else}<em class="text-warning not-italic">tidak diset</em>{/if}</span>
			<span class="text-base-content/50">FROM</span>
			<span>{#if data.smtp.from}{data.smtp.from}{:else}<em class="text-warning not-italic">tidak diset</em>{/if}</span>
		</div>
	</div>

	<!-- Override toggle -->
	<div class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-box">
		<input type="checkbox" bind:checked={showOverride} />
		<div class="collapse-title font-medium text-sm">
			Override SMTP (opsional — kosongkan untuk pakai ENV)
		</div>
		<div class="collapse-content">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
				<label class="form-control">
					<span class="label-text text-xs mb-1">Host</span>
					<input class="input input-bordered input-sm font-mono" bind:value={overrideHost} placeholder="smtp.gmail.com" />
				</label>
				<label class="form-control">
					<span class="label-text text-xs mb-1">Port</span>
					<input class="input input-bordered input-sm font-mono" bind:value={overridePort} type="number" placeholder="587" />
				</label>
				<label class="form-control">
					<span class="label-text text-xs mb-1">Username</span>
					<input class="input input-bordered input-sm font-mono" bind:value={overrideUser} placeholder="user@example.com" />
				</label>
				<label class="form-control">
					<span class="label-text text-xs mb-1">Password / App Password</span>
					<div class="relative">
						<input
							class="input input-bordered input-sm font-mono w-full pr-10"
							type={showPassword ? 'text' : 'password'}
							bind:value={overridePass}
							placeholder="••••••••"
						/>
						<button
							type="button"
							class="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content text-xs"
							onclick={() => (showPassword = !showPassword)}
						>
							{showPassword ? '🙈' : '👁'}
						</button>
					</div>
				</label>
				<label class="form-control">
					<span class="label-text text-xs mb-1">From Address</span>
					<input class="input input-bordered input-sm font-mono" bind:value={overrideFrom} placeholder="noreply@papanin.app" />
				</label>
				<label class="form-control">
					<span class="label-text text-xs mb-1">From Name</span>
					<input class="input input-bordered input-sm" bind:value={overrideFromName} placeholder="Papanin" />
				</label>
			</div>
		</div>
	</div>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-boxed">
		<button
			role="tab"
			class="tab {activeTab === 'verify' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'verify')}
		>
			🔌 Tes Koneksi
		</button>
		<button
			role="tab"
			class="tab {activeTab === 'send' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'send')}
		>
			📨 Kirim Email Test
		</button>
	</div>

	<!-- Tab: Verify -->
	{#if activeTab === 'verify'}
		<form
			method="POST"
			action="?/verify_connection"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
			<!-- Hidden override fields -->
			<input type="hidden" name="host" value={overrideHost} />
			<input type="hidden" name="port" value={overridePort} />
			<input type="hidden" name="user" value={overrideUser} />
			<input type="hidden" name="pass" value={overridePass} />

			<div class="alert alert-info text-sm">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 shrink-0 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
				<span>Hanya mengecek handshake SMTP — tidak ada email yang dikirim.</span>
			</div>

			<button
				type="submit"
				class="btn btn-primary w-full"
				disabled={loading}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span> Menguji koneksi…
				{:else}
					🔌 Test Koneksi SMTP
				{/if}
			</button>
		</form>

		<!-- Result: verify -->
		{#if form}
			<div class="card {form.error ? 'bg-error/10 border-error' : 'bg-success/10 border-success'} border rounded-box p-4 space-y-2">
				{#if form.error}
					<div class="flex items-center gap-2 font-semibold text-error">
						<span>❌ Koneksi Gagal</span>
						{#if form.elapsed}
							<span class="text-xs font-normal text-base-content/50">{form.elapsed}ms</span>
						{/if}
					</div>
					<pre class="text-xs text-error/80 bg-base-100 rounded p-3 overflow-x-auto whitespace-pre-wrap">{form.error}</pre>
				{:else if form.verified}
					<div class="flex items-center gap-2 font-semibold text-success">
						<span>✅ Koneksi Berhasil</span>
						{#if form.elapsed}
							<span class="text-xs font-normal text-base-content/50">{form.elapsed}ms</span>
						{/if}
					</div>
					<p class="text-sm text-base-content/70">
						Terhubung ke <code class="font-mono">{form.host}:{form.port}</code> — SMTP siap dipakai.
					</p>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- Tab: Send -->
	{#if activeTab === 'send'}
		<form
			method="POST"
			action="?/send_test"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
			<!-- Hidden override fields -->
			<input type="hidden" name="host" value={overrideHost} />
			<input type="hidden" name="port" value={overridePort} />
			<input type="hidden" name="user" value={overrideUser} />
			<input type="hidden" name="pass" value={overridePass} />
			<input type="hidden" name="from" value={overrideFrom} />
			<input type="hidden" name="fromName" value={overrideFromName} />

			<label class="form-control">
				<span class="label-text font-medium mb-1">Kirim ke <span class="text-error">*</span></span>
				<input
					id="smtp-test-to"
					class="input input-bordered"
					type="email"
					name="to"
					bind:value={toAddr}
					placeholder="kamu@example.com"
					required
				/>
			</label>

			<label class="form-control">
				<span class="label-text font-medium mb-1">Subject</span>
				<input
					class="input input-bordered"
					type="text"
					name="subject"
					bind:value={subject}
					placeholder="Test Email dari Papanin Admin"
				/>
			</label>

			<label class="form-control">
				<span class="label-text font-medium mb-1">Isi Pesan</span>
				<textarea
					class="textarea textarea-bordered font-mono text-sm h-32 resize-none"
					name="body"
					bind:value={body}
				></textarea>
			</label>

			<button
				type="submit"
				class="btn btn-primary w-full"
				disabled={loading || !toAddr}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span> Mengirim…
				{:else}
					📨 Kirim Email Test
				{/if}
			</button>
		</form>

		<!-- Result: send -->
		{#if form}
			<div class="card {form.error ? 'bg-error/10 border-error' : 'bg-success/10 border-success'} border rounded-box p-4 space-y-2">
				{#if form.error}
					<div class="flex items-center gap-2 font-semibold text-error">
						<span>❌ Pengiriman Gagal</span>
						{#if form.elapsed}
							<span class="text-xs font-normal text-base-content/50">{form.elapsed}ms</span>
						{/if}
					</div>
					<pre class="text-xs text-error/80 bg-base-100 rounded p-3 overflow-x-auto whitespace-pre-wrap">{form.error}</pre>
					{#if form.host}
						<p class="text-xs text-base-content/50">Host: <code>{form.host}:{form.port}</code></p>
					{/if}
				{:else if form.success}
					<div class="flex items-center gap-2 font-semibold text-success">
						<span>✅ Email Terkirim!</span>
						{#if form.elapsed}
							<span class="text-xs font-normal text-base-content/50">{form.elapsed}ms</span>
						{/if}
					</div>
					<div class="text-sm space-y-1 text-base-content/70">
						<p>Dikirim ke: <span class="font-mono font-medium text-base-content">{form.to}</span></p>
						<p>Message-ID: <span class="font-mono text-xs">{form.messageId}</span></p>
						<p>Server: <code class="font-mono">{form.host}:{form.port}</code></p>
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- Tips -->
	<div class="alert text-sm">
		<div class="space-y-1 text-base-content/60">
			<p class="font-medium text-base-content/80">💡 Tips konfigurasi SMTP</p>
			<ul class="list-disc list-inside space-y-0.5 text-xs">
				<li><strong>Gmail:</strong> Pakai App Password (bukan password utama). Port 587 / STARTTLS.</li>
				<li><strong>Brevo / Sendinblue:</strong> Port 587, user = email akun, pass = SMTP key.</li>
				<li><strong>Mailtrap (dev):</strong> Port 2525, ambil creds dari dashboard Mailtrap.</li>
				<li><strong>Port 465:</strong> Implicit TLS (SSL). Port 587: STARTTLS. Port 25: plain (tidak disarankan).</li>
			</ul>
		</div>
	</div>

</div>
