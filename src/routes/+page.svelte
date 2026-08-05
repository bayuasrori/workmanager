<script lang="ts">
	import type { PageData } from './$types';
	import type { PlanCard } from './+page.server';

	let { data }: { data: PageData } = $props();

	// plans is returned by +page.server.ts but not yet visible in generated PageData —
	// cast safely since the server always returns the field (empty array on DB error).
	const plans: PlanCard[] = $derived(
		((data as PageData & { plans?: PlanCard[] }).plans) ?? []
	);

	const PLAN_LABELS: Record<string, string> = {
		free: 'Gratis',
		pro: 'Pro',
		team: 'Tim'
	};

	function fmt(v: number | null): string {
		if (v === null || !isFinite(v)) return 'Tak terbatas';
		return v.toLocaleString('id-ID');
	}

	function fmtStorage(mb: number): string {
		if (!isFinite(mb)) return 'Tak terbatas';
		if (mb >= 1024) return `${mb / 1024} GB`;
		return `${mb} MB`;
	}

	function fmtPrice(price: number, currency: string): string {
		if (price === 0) return 'Gratis';
		if (currency === 'IDR') return `Rp\u00a0${price.toLocaleString('id-ID')}`;
		return `$${price}`;
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,300&family=Inter:ital,wght@0,400;0,500;0,600;1,400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Navigation -->
<header class="lp-nav">
	<nav class="lp-nav-inner">
		<a href="/" class="lp-logo">Papanin</a>
		<div class="lp-nav-links">
			<a href="#fitur">Fitur</a>
			<a href="#cara-kerja">Cara kerja</a>
		</div>
		<div class="lp-nav-cta">
			{#if data.isAuthenticated}
				<a href="/dashboard" class="lp-btn-nav">Buka Dashboard</a>
			{:else}
				<a href="/login" class="lp-btn-nav">Masuk</a>
			{/if}
		</div>
	</nav>
</header>

<!-- Hero -->
<section class="lp-hero">
	<div class="lp-hero-grid">
		<div class="lp-hero-text">
			<p class="lp-eyebrow">Manajemen kerja tim</p>
			<h1 class="lp-hero-heading">
				Semua pekerjaan<br />
				<em>dalam satu papan.</em>
			</h1>
			<p class="lp-hero-sub">
				Papanin mengatur tugas, tim, dan tenggat dalam satu tempat—tanpa kerumitan alat yang tidak
				pernah benar-benar dipakai.
			</p>
			<div class="lp-hero-actions">
				{#if data.isAuthenticated}
					<a href="/dashboard" class="lp-btn-dark">Buka Dashboard</a>
				{:else}
					<a href="/login" class="lp-btn-dark">Coba Gratis</a>
				{/if}
				<a href="/public-board/create" class="lp-btn-ghost">Buat papan publik →</a>
			</div>
		</div>

		<!-- Kanban board visual -->
		<div class="lp-hero-visual" aria-hidden="true">
			<div class="lp-board">
				<div class="lp-board-header">
					<span class="lp-board-title">Sprint Agustus</span>
					<div class="lp-board-avatars">
						<div class="lp-avatar" style="--bg: #bfdbfe">AR</div>
						<div class="lp-avatar" style="--bg: #bbf7d0">BT</div>
						<div class="lp-avatar" style="--bg: #fde68a">CI</div>
					</div>
				</div>
				<div class="lp-board-cols">
					<div class="lp-col">
						<div class="lp-col-head">
							<span class="lp-col-dot" style="background:#94a3b8"></span>
							Antrian
							<span class="lp-col-count">3</span>
						</div>
						<div class="lp-card">
							<span class="lp-card-title">Riset kompetitor</span>
							<div class="lp-card-foot">
								<div class="lp-card-avatar" style="--bg: #bfdbfe">AR</div>
							</div>
						</div>
						<div class="lp-card">
							<span class="lp-card-title">Update halaman login</span>
							<div class="lp-card-foot">
								<div class="lp-card-avatar" style="--bg: #fde68a">CI</div>
							</div>
						</div>
						<div class="lp-card">
							<span class="lp-card-title">Buat onboarding flow</span>
							<div class="lp-card-foot">
								<div class="lp-card-avatar" style="--bg: #bbf7d0">BT</div>
							</div>
						</div>
					</div>
					<div class="lp-col">
						<div class="lp-col-head">
							<span class="lp-col-dot" style="background:#fb923c"></span>
							Dikerjakan
							<span class="lp-col-count">2</span>
						</div>
						<div class="lp-card lp-card--active">
							<span class="lp-card-tag">Tinggi</span>
							<span class="lp-card-title">Redesign landing page</span>
							<div class="lp-card-foot">
								<div class="lp-card-avatar" style="--bg: #bfdbfe">AR</div>
							</div>
						</div>
						<div class="lp-card">
							<span class="lp-card-title">Integrasi payment</span>
							<div class="lp-card-foot">
								<div class="lp-card-avatar" style="--bg: #bbf7d0">BT</div>
							</div>
						</div>
					</div>
					<div class="lp-col">
						<div class="lp-col-head">
							<span class="lp-col-dot" style="background:#4ade80"></span>
							Selesai
							<span class="lp-col-count">3</span>
						</div>
						<div class="lp-card lp-card--done">
							<span class="lp-card-title">Setup database</span>
						</div>
						<div class="lp-card lp-card--done">
							<span class="lp-card-title">Auth &amp; session</span>
						</div>
						<div class="lp-card lp-card--done">
							<span class="lp-card-title">Email notifikasi</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Statement -->
<section class="lp-statement">
	<div class="lp-statement-inner">
		<div class="lp-statement-problems">
			<p>— Ide tersebar di chat grup.</p>
			<p>— Progress tidak terlihat.</p>
			<p>— Tim tidak sinkron.</p>
		</div>
		<div class="lp-statement-solution">
			<p>Papanin punya satu tempat<br />untuk semuanya.</p>
		</div>
	</div>
</section>

<!-- Features -->
<section id="fitur" class="lp-features">
	<div class="lp-features-intro">
		<span class="lp-eyebrow lp-eyebrow--muted">Fitur utama</span>
	</div>

	<!-- Feature 01 -->
	<div class="lp-feature-wrap">
		<div class="lp-feature">
			<div class="lp-feature-text">
				<div class="lp-feature-num">01</div>
				<h2 class="lp-feature-heading">Organisasi<br />dengan struktur.</h2>
				<p class="lp-feature-desc">
					Buat organisasi, undang anggota, dan atur peran akses. Setiap proyek terisolasi dengan
					bersih—tidak ada data yang tercampur antar tim.
				</p>
			</div>
			<div class="lp-feature-visual" aria-hidden="true">
				<div class="lp-vis-org">
					<div class="lp-vis-org-header">
						<div class="lp-vis-org-name">
							<div class="lp-vis-org-icon">TP</div>
							Tim Produk
						</div>
						<div class="lp-vis-org-badge">Admin</div>
					</div>
					<div class="lp-vis-org-members">
						<div class="lp-vis-member">
							<div class="lp-avatar lp-avatar--sm" style="--bg: #bfdbfe">AR</div>
							<div class="lp-vis-member-info">
								<span>Arif Rahmat</span>
								<span class="lp-vis-member-role">Owner</span>
							</div>
						</div>
						<div class="lp-vis-member">
							<div class="lp-avatar lp-avatar--sm" style="--bg: #bbf7d0">BT</div>
							<div class="lp-vis-member-info">
								<span>Bayu Tri</span>
								<span class="lp-vis-member-role">Member</span>
							</div>
						</div>
						<div class="lp-vis-member">
							<div class="lp-avatar lp-avatar--sm" style="--bg: #fde68a">CI</div>
							<div class="lp-vis-member-info">
								<span>Citra Indah</span>
								<span class="lp-vis-member-role">Member</span>
							</div>
						</div>
						<div class="lp-vis-member lp-vis-member--add">+ Undang anggota</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Feature 02 -->
	<div class="lp-feature-wrap lp-feature-wrap--alt">
		<div class="lp-feature lp-feature--reverse">
			<div class="lp-feature-text">
				<div class="lp-feature-num">02</div>
				<h2 class="lp-feature-heading">Proyek yang<br />bisa dipantau.</h2>
				<p class="lp-feature-desc">
					Susun pekerjaan dalam proyek dengan status dan tenggat yang bisa dikustomisasi. Lihat
					progres tim secara langsung—tanpa perlu menanyakan satu per satu.
				</p>
			</div>
			<div class="lp-feature-visual" aria-hidden="true">
				<div class="lp-vis-progress">
					<div class="lp-vis-progress-header">
						<span>Proyek Mobile App</span>
						<span class="lp-vis-progress-date">Tenggat: 30 Agt</span>
					</div>
					<div class="lp-vis-bars">
						<div class="lp-vis-bar-item">
							<div class="lp-vis-bar-label">
								<span>Sprint 3</span>
								<span>73%</span>
							</div>
							<div class="lp-vis-bar-track">
								<div class="lp-vis-bar-fill" style="width: 73%"></div>
							</div>
						</div>
						<div class="lp-vis-bar-item">
							<div class="lp-vis-bar-label">
								<span>Riset User</span>
								<span>40%</span>
							</div>
							<div class="lp-vis-bar-track">
								<div class="lp-vis-bar-fill" style="width: 40%"></div>
							</div>
						</div>
						<div class="lp-vis-bar-item">
							<div class="lp-vis-bar-label">
								<span>Desain UI</span>
								<span class="lp-vis-done">Selesai</span>
							</div>
							<div class="lp-vis-bar-track">
								<div class="lp-vis-bar-fill lp-vis-bar-fill--done" style="width: 100%"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Feature 03 -->
	<div class="lp-feature-wrap">
		<div class="lp-feature">
			<div class="lp-feature-text">
				<div class="lp-feature-num">03</div>
				<h2 class="lp-feature-heading">Papan publik<br />tanpa akun.</h2>
				<p class="lp-feature-desc">
					Buat papan publik dan bagikan dengan satu tautan. Siapa pun bisa melihat dan
					berkontribusi—cocok untuk proyek terbuka atau kolaborasi komunitas.
				</p>
			</div>
			<div class="lp-feature-visual" aria-hidden="true">
				<div class="lp-vis-public">
					<div class="lp-vis-public-url">
						<span class="lp-vis-url-icon">🔗</span>
						<span>papanin.app/b/<strong>oss-project</strong></span>
						<span class="lp-vis-public-badge">Publik</span>
					</div>
					<div class="lp-vis-public-tasks">
						<div class="lp-vis-pub-task">
							<span class="lp-vis-pub-dot" style="background:#94a3b8"></span>
							Bug: form validasi gagal
						</div>
						<div class="lp-vis-pub-task lp-vis-pub-task--active">
							<span class="lp-vis-pub-dot" style="background:#fb923c"></span>
							Add dark mode <em>— sedang dikerjakan</em>
						</div>
						<div class="lp-vis-pub-task">
							<span class="lp-vis-pub-dot" style="background:#94a3b8"></span>
							Dokumentasi API
						</div>
						<div class="lp-vis-pub-task lp-vis-pub-task--done">
							<span class="lp-vis-pub-dot" style="background:#4ade80"></span>
							<s>Setup CI/CD</s>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- How it works -->
<section id="cara-kerja" class="lp-how">
	<div class="lp-how-inner">
		<div class="lp-how-header">
			<span class="lp-eyebrow">Cara kerja</span>
			<h2 class="lp-how-heading">Dari nol<br /><em>sampai jalan.</em></h2>
		</div>
		<div class="lp-how-steps">
			<div class="lp-step">
				<div class="lp-step-num">1</div>
				<h3 class="lp-step-title">Daftar dan buat organisasi</h3>
				<p class="lp-step-desc">Satu akun untuk semua. Undang tim, langsung mulai kerja.</p>
			</div>
			<div class="lp-step-arrow" aria-hidden="true">→</div>
			<div class="lp-step">
				<div class="lp-step-num">2</div>
				<h3 class="lp-step-title">Buat proyek dan atur status</h3>
				<p class="lp-step-desc">Tentukan alur kerja sesuai ritme tim kamu—fleksibel dan mudah diubah.</p>
			</div>
			<div class="lp-step-arrow" aria-hidden="true">→</div>
			<div class="lp-step">
				<div class="lp-step-num">3</div>
				<h3 class="lp-step-title">Bagi tugas ke anggota</h3>
				<p class="lp-step-desc">Siapa mengerjakan apa, kapan selesainya—transparan untuk semua.</p>
			</div>
			<div class="lp-step-arrow" aria-hidden="true">→</div>
			<div class="lp-step">
				<div class="lp-step-num">4</div>
				<h3 class="lp-step-title">Pantau progres bersama</h3>
				<p class="lp-step-desc">Tidak perlu rapat status kalau papannya sudah berbicara sendiri.</p>
			</div>
		</div>
	</div>
</section>

<!-- Pricing -->
{#if plans.length > 0}
	<section id="harga" class="lp-pricing">
		<div class="lp-pricing-inner">
			<div class="lp-pricing-header">
				<span class="lp-eyebrow">Harga</span>
				<h2 class="lp-pricing-heading">Pilih sesuai<br /><em>kebutuhanmu.</em></h2>
				<p class="lp-pricing-sub">Mulai gratis, upgrade kapan saja.</p>
			</div>

			<div class="lp-plans">
				{#each plans as plan (plan.id)}
					<div class="lp-plan" class:lp-plan--featured={plan.isHighlighted}>
						{#if plan.isHighlighted}
							<div class="lp-plan-badge">Paling populer</div>
						{/if}

						<div class="lp-plan-header">
							<h3 class="lp-plan-name">{PLAN_LABELS[plan.name] ?? plan.name}</h3>
							<div class="lp-plan-price">{fmtPrice(plan.price, plan.currency)}</div>
							{#if plan.price > 0}
								<div class="lp-plan-period">per bulan</div>
							{:else}
								<div class="lp-plan-period">selamanya</div>
							{/if}
						</div>

						{#if plan.description}
							<p class="lp-plan-desc">{plan.description}</p>
						{/if}

						<ul class="lp-plan-specs">
							<li>
								<span class="lp-spec-k">Proyek</span>
								<span class="lp-spec-v">{fmt(plan.maxProjects)}</span>
							</li>
							<li>
								<span class="lp-spec-k">Anggota</span>
								<span class="lp-spec-v">
									{plan.maxOrgMembers === null ? 'Per seat' : fmt(plan.maxOrgMembers)}
								</span>
							</li>
							<li>
								<span class="lp-spec-k">Kredit AI</span>
								<span class="lp-spec-v">{fmt(plan.aiMonthly)} / bln</span>
							</li>
							<li>
								<span class="lp-spec-k">Penyimpanan</span>
								<span class="lp-spec-v">{fmtStorage(plan.storageMb)}</span>
							</li>
						</ul>

						<div class="lp-plan-divider"></div>

						<ul class="lp-plan-features">
							<li class="lp-plan-feat">✓ Papan publik</li>
							{#if plan.features.customStatus}
								<li class="lp-plan-feat">✓ Custom status</li>
							{/if}
							{#if plan.features.timelineFull}
								<li class="lp-plan-feat">✓ Timeline lengkap</li>
							{/if}
							{#if plan.features.aiAutomation}
								<li class="lp-plan-feat">✓ AI otomasi</li>
							{/if}
							{#if plan.features.export}
								<li class="lp-plan-feat">✓ Export data</li>
							{/if}
							{#if plan.features.customBranding}
								<li class="lp-plan-feat">✓ Custom branding</li>
							{/if}
						</ul>

						<div class="lp-plan-action">
							{#if data.isAuthenticated}
								<a
									href="/billing"
									class={plan.isHighlighted ? 'lp-plan-btn lp-plan-btn--featured' : 'lp-plan-btn'}
								>Kelola Plan</a
								>
							{:else if plan.price === 0}
								<a
									href="/login"
									class={plan.isHighlighted ? 'lp-plan-btn lp-plan-btn--featured' : 'lp-plan-btn'}
								>Mulai Gratis</a
								>
							{:else}
								<a
									href="/login"
									class={plan.isHighlighted ? 'lp-plan-btn lp-plan-btn--featured' : 'lp-plan-btn'}
								>Pilih {PLAN_LABELS[plan.name] ?? plan.name}</a
								>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- CTA -->
<section id="mulai" class="lp-cta">
	<div class="lp-cta-inner">
		<div class="lp-cta-text">
			<span class="lp-eyebrow lp-eyebrow--light">Mulai hari ini</span>
			<h2 class="lp-cta-heading">
				Sudah cukup<br />
				<em>menunda.</em>
			</h2>
		</div>
		<div class="lp-cta-action">
			<p>Gratis untuk digunakan. Tidak butuh kartu kredit.</p>
			{#if data.isAuthenticated}
				<a href="/dashboard" class="lp-btn-accent">Buka Dashboard →</a>
			{:else}
				<a href="/login" class="lp-btn-accent">Buat Akun Gratis →</a>
			{/if}
			<a href="/public-board/create" class="lp-btn-ghost-light">Atau mulai dengan papan publik</a>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="lp-footer">
	<div class="lp-footer-inner">
		<div class="lp-footer-left">
			<span class="lp-footer-logo">Papanin</span>
			<p>Permudah pekerjaanmu, rapikan kerja tim.</p>
		</div>
		<div class="lp-footer-right">
			<p>Dibangun dengan SvelteKit, Drizzle ORM, Tailwind CSS</p>
			<p class="lp-footer-copy">© 2024 Papanin</p>
		</div>
	</div>
</footer>

<style>
	/* ── Design System ─────────────────────────────── */
	:root {
		--lp-paper: #fafaf8;
		--lp-warm: #f2ece2;
		--lp-ink: #1c1917;
		--lp-ink-2: #292524;
		--lp-mid: #44403c;
		--lp-muted: #78716c;
		--lp-border: #e5ddd0;
		--lp-accent: #c05621;
		--lp-accent-bg: #fff4ec;
		--lp-dark: #111110;

		--lp-display: 'Fraunces', Georgia, serif;
		--lp-sans: 'Inter', system-ui, -apple-system, sans-serif;

		--lp-nav-h: 64px;
		--lp-radius: 10px;
		--lp-max: 1200px;
		--lp-px: clamp(1.5rem, 5vw, 4rem);
	}

	/* ── Base reset for landing sections ───────────── */
	.lp-nav,
	.lp-hero,
	.lp-statement,
	.lp-features,
	.lp-how,
	.lp-cta,
	.lp-footer {
		font-family: var(--lp-sans);
		box-sizing: border-box;
	}

	/* ── Navigation ────────────────────────────────── */
	.lp-nav {
		position: sticky;
		top: 0;
		z-index: 50;
		height: var(--lp-nav-h);
		background: rgba(250, 250, 248, 0.92);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--lp-border);
	}

	.lp-nav-inner {
		max-width: var(--lp-max);
		margin: 0 auto;
		padding: 0 var(--lp-px);
		height: 100%;
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.lp-logo {
		font-family: var(--lp-display);
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--lp-ink);
		text-decoration: none;
		letter-spacing: -0.02em;
		flex-shrink: 0;
	}

	.lp-nav-links {
		display: flex;
		gap: 0.125rem;
		margin-left: auto;
	}

	.lp-nav-links a {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--lp-mid);
		text-decoration: none;
		padding: 0.4rem 0.75rem;
		border-radius: 6px;
		transition:
			color 0.15s,
			background 0.15s;
	}

	.lp-nav-links a:hover {
		color: var(--lp-ink);
		background: var(--lp-warm);
	}

	.lp-nav-cta {
		flex-shrink: 0;
	}

	/* ── Buttons ───────────────────────────────────── */
	.lp-btn-nav {
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--lp-sans);
		color: var(--lp-ink);
		background: transparent;
		border: 1.5px solid var(--lp-border);
		padding: 0.45rem 1.1rem;
		border-radius: 6px;
		text-decoration: none;
		transition:
			border-color 0.15s,
			background 0.15s;
		display: inline-block;
	}

	.lp-btn-nav:hover {
		background: var(--lp-warm);
		border-color: var(--lp-mid);
	}

	.lp-btn-dark {
		font-size: 1rem;
		font-weight: 600;
		font-family: var(--lp-sans);
		color: #fff;
		background: var(--lp-ink);
		border: 2px solid var(--lp-ink);
		padding: 0.75rem 1.75rem;
		border-radius: var(--lp-radius);
		text-decoration: none;
		transition:
			opacity 0.15s,
			transform 0.15s;
		display: inline-block;
	}

	.lp-btn-dark:hover {
		opacity: 0.82;
		transform: translateY(-1px);
	}

	.lp-btn-ghost {
		font-size: 0.9375rem;
		font-weight: 500;
		font-family: var(--lp-sans);
		color: var(--lp-muted);
		background: transparent;
		border: none;
		padding: 0.75rem 0;
		text-decoration: none;
		transition: color 0.15s;
		display: inline-block;
	}

	.lp-btn-ghost:hover {
		color: var(--lp-ink);
	}

	.lp-btn-accent {
		font-size: 1.0625rem;
		font-weight: 600;
		font-family: var(--lp-sans);
		color: #fff;
		background: var(--lp-accent);
		border: 2px solid var(--lp-accent);
		padding: 0.875rem 2rem;
		border-radius: var(--lp-radius);
		text-decoration: none;
		transition:
			opacity 0.15s,
			transform 0.15s;
		display: inline-block;
		letter-spacing: -0.01em;
	}

	.lp-btn-accent:hover {
		opacity: 0.88;
		transform: translateY(-1px);
	}

	.lp-btn-ghost-light {
		font-size: 0.9375rem;
		font-weight: 500;
		font-family: var(--lp-sans);
		color: rgba(255, 255, 255, 0.45);
		background: transparent;
		border: none;
		padding: 0.25rem 0;
		text-decoration: none;
		transition: color 0.15s;
		display: inline-block;
	}

	.lp-btn-ghost-light:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	/* ── Typography utilities ──────────────────────── */
	.lp-eyebrow {
		display: inline-block;
		font-size: 0.6875rem;
		font-weight: 600;
		font-family: var(--lp-sans);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--lp-accent);
	}

	.lp-eyebrow--muted {
		color: var(--lp-muted);
	}

	.lp-eyebrow--light {
		color: rgba(255, 255, 255, 0.45);
	}

	/* ── Hero ──────────────────────────────────────── */
	.lp-hero {
		background: var(--lp-paper);
		min-height: calc(100svh - var(--lp-nav-h));
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	.lp-hero-grid {
		max-width: var(--lp-max);
		margin: 0 auto;
		padding: 5rem var(--lp-px);
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.lp-hero-text {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.lp-hero-heading {
		font-family: var(--lp-display);
		font-size: clamp(2.75rem, 5vw, 4.5rem);
		font-weight: 400;
		line-height: 1.07;
		letter-spacing: -0.03em;
		color: var(--lp-ink);
		margin: 0;
	}

	.lp-hero-heading em {
		font-style: italic;
		color: var(--lp-accent);
	}

	.lp-hero-sub {
		font-size: 1.0625rem;
		line-height: 1.65;
		color: var(--lp-mid);
		max-width: 420px;
		margin: 0;
	}

	.lp-hero-actions {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
		margin-top: 0.5rem;
	}

	/* ── Kanban Board Visual ───────────────────────── */
	.lp-hero-visual {
		position: relative;
	}

	.lp-board {
		background: #fff;
		border: 1px solid var(--lp-border);
		border-radius: 14px;
		box-shadow:
			0 4px 6px -1px rgba(28, 25, 23, 0.04),
			0 24px 64px -12px rgba(28, 25, 23, 0.12);
		overflow: hidden;
		transform: perspective(1000px) rotateY(-2.5deg) rotateX(1.5deg);
		transition: transform 0.4s ease;
	}

	.lp-board:hover {
		transform: perspective(1000px) rotateY(0deg) rotateX(0deg);
	}

	.lp-board-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem 0.875rem;
		border-bottom: 1px solid var(--lp-border);
		background: var(--lp-paper);
	}

	.lp-board-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--lp-ink);
		font-family: var(--lp-sans);
	}

	.lp-board-avatars {
		display: flex;
	}

	.lp-avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--bg, #e5e7eb);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5625rem;
		font-weight: 700;
		font-family: var(--lp-sans);
		color: var(--lp-ink);
		border: 2px solid #fff;
		margin-left: -5px;
		flex-shrink: 0;
	}

	.lp-avatar:first-child {
		margin-left: 0;
	}

	.lp-avatar--sm {
		width: 32px;
		height: 32px;
		font-size: 0.625rem;
	}

	.lp-board-cols {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.625rem;
		padding: 0.875rem;
		background: #f5f3f0;
		min-height: 260px;
	}

	.lp-col {
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
	}

	.lp-col-head {
		display: flex;
		align-items: center;
		gap: 0.3125rem;
		font-size: 0.625rem;
		font-weight: 700;
		font-family: var(--lp-sans);
		color: var(--lp-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		padding: 0.25rem 0 0.375rem;
	}

	.lp-col-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.lp-col-count {
		margin-left: auto;
		background: var(--lp-border);
		color: var(--lp-muted);
		font-size: 0.5625rem;
		padding: 1px 5px;
		border-radius: 8px;
		font-weight: 700;
	}

	.lp-card {
		background: #fff;
		border: 1px solid var(--lp-border);
		border-radius: 7px;
		padding: 0.5625rem 0.6875rem;
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
		cursor: default;
		transition: box-shadow 0.15s;
	}

	.lp-card:hover {
		box-shadow: 0 2px 8px rgba(28, 25, 23, 0.07);
	}

	.lp-card--active {
		border-color: #fb923c;
		border-left-width: 3px;
	}

	.lp-card--done {
		opacity: 0.5;
	}

	.lp-card-tag {
		font-size: 0.5rem;
		font-weight: 700;
		font-family: var(--lp-sans);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #c2410c;
		background: #fff7ed;
		padding: 2px 6px;
		border-radius: 4px;
		align-self: flex-start;
	}

	.lp-card-title {
		font-size: 0.6875rem;
		font-weight: 500;
		font-family: var(--lp-sans);
		color: var(--lp-ink);
		line-height: 1.4;
	}

	.lp-card--done .lp-card-title {
		text-decoration: line-through;
		color: var(--lp-muted);
	}

	.lp-card-foot {
		display: flex;
		justify-content: flex-end;
	}

	.lp-card-avatar {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--bg, #e5e7eb);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.375rem;
		font-weight: 700;
		font-family: var(--lp-sans);
		color: var(--lp-ink);
	}

	/* ── Statement ─────────────────────────────────── */
	.lp-statement {
		background: var(--lp-ink);
		padding: 5rem var(--lp-px);
	}

	.lp-statement-inner {
		max-width: var(--lp-max);
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.lp-statement-problems {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.lp-statement-problems p {
		font-family: var(--lp-sans);
		font-size: clamp(1rem, 2vw, 1.3125rem);
		font-weight: 400;
		color: rgba(255, 255, 255, 0.35);
		margin: 0;
		line-height: 1.5;
	}

	.lp-statement-solution p {
		font-family: var(--lp-display);
		font-size: clamp(1.75rem, 3.5vw, 2.875rem);
		font-weight: 400;
		color: #fff;
		margin: 0;
		line-height: 1.2;
		letter-spacing: -0.025em;
	}

	/* ── Features ──────────────────────────────────── */
	.lp-features {
		background: var(--lp-paper);
	}

	.lp-features-intro {
		max-width: var(--lp-max);
		margin: 0 auto;
		padding: 4rem var(--lp-px) 0;
	}

	.lp-feature-wrap {
		border-bottom: 1px solid var(--lp-border);
	}

	.lp-feature-wrap:last-child {
		border-bottom: none;
	}

	.lp-feature-wrap--alt {
		background: var(--lp-warm);
	}

	.lp-feature {
		max-width: var(--lp-max);
		margin: 0 auto;
		padding: 5rem var(--lp-px);
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5rem;
		align-items: center;
	}

	.lp-feature--reverse .lp-feature-text {
		order: 2;
	}

	.lp-feature--reverse .lp-feature-visual {
		order: 1;
	}

	.lp-feature-text {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.lp-feature-num {
		font-family: var(--lp-display);
		font-size: clamp(3rem, 6vw, 5.5rem);
		font-weight: 300;
		color: var(--lp-border);
		line-height: 1;
		letter-spacing: -0.04em;
		margin-bottom: -0.375rem;
	}

	.lp-feature-wrap--alt .lp-feature-num {
		color: #ddd4c5;
	}

	.lp-feature-heading {
		font-family: var(--lp-display);
		font-size: clamp(2rem, 3.5vw, 3rem);
		font-weight: 400;
		line-height: 1.1;
		letter-spacing: -0.025em;
		color: var(--lp-ink);
		margin: 0;
	}

	.lp-feature-desc {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--lp-mid);
		max-width: 400px;
		margin: 0;
	}

	/* ── Feature Visual: Org ───────────────────────── */
	.lp-vis-org {
		background: #fff;
		border: 1px solid var(--lp-border);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 24px rgba(28, 25, 23, 0.06);
	}

	.lp-vis-org-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.125rem 1.375rem;
		border-bottom: 1px solid var(--lp-border);
		background: var(--lp-paper);
	}

	.lp-vis-org-name {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--lp-sans);
		color: var(--lp-ink);
	}

	.lp-vis-org-icon {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		background: var(--lp-accent);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		font-weight: 700;
		font-family: var(--lp-sans);
		flex-shrink: 0;
		letter-spacing: 0.02em;
	}

	.lp-vis-org-badge {
		font-size: 0.625rem;
		font-weight: 700;
		font-family: var(--lp-sans);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--lp-accent);
		background: var(--lp-accent-bg);
		padding: 3px 10px;
		border-radius: 20px;
		border: 1px solid rgba(192, 86, 33, 0.2);
	}

	.lp-vis-org-members {
		display: flex;
		flex-direction: column;
	}

	.lp-vis-member {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.8125rem 1.375rem;
		border-bottom: 1px solid var(--lp-border);
		transition: background 0.15s;
	}

	.lp-vis-member:last-child {
		border-bottom: none;
	}

	.lp-vis-member:hover {
		background: var(--lp-paper);
	}

	.lp-vis-member-info {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.lp-vis-member-info span:first-child {
		font-size: 0.8125rem;
		font-weight: 500;
		font-family: var(--lp-sans);
		color: var(--lp-ink);
	}

	.lp-vis-member-role {
		font-size: 0.6875rem;
		color: var(--lp-muted);
		font-family: var(--lp-sans);
	}

	.lp-vis-member--add {
		color: var(--lp-accent);
		font-size: 0.8125rem;
		font-weight: 500;
		font-family: var(--lp-sans);
		cursor: pointer;
		padding-left: calc(1.375rem + 32px + 0.75rem);
	}

	/* ── Feature Visual: Progress ──────────────────── */
	.lp-vis-progress {
		background: #fff;
		border: 1px solid var(--lp-border);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 24px rgba(28, 25, 23, 0.06);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.lp-vis-progress-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-family: var(--lp-sans);
	}

	.lp-vis-progress-header span:first-child {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--lp-ink);
	}

	.lp-vis-progress-date {
		font-size: 0.75rem;
		color: var(--lp-muted);
	}

	.lp-vis-bars {
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
	}

	.lp-vis-bar-item {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.lp-vis-bar-label {
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
		font-family: var(--lp-sans);
		color: var(--lp-mid);
		font-weight: 500;
	}

	.lp-vis-done {
		color: #16a34a;
		font-weight: 600;
	}

	.lp-vis-bar-track {
		height: 6px;
		background: var(--lp-border);
		border-radius: 3px;
		overflow: hidden;
	}

	.lp-vis-bar-fill {
		height: 100%;
		background: var(--lp-accent);
		border-radius: 3px;
	}

	.lp-vis-bar-fill--done {
		background: #4ade80;
	}

	/* ── Feature Visual: Public board ─────────────── */
	.lp-vis-public {
		background: #fff;
		border: 1px solid var(--lp-border);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 24px rgba(28, 25, 23, 0.06);
	}

	.lp-vis-public-url {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.8125rem 1.125rem;
		background: var(--lp-paper);
		border-bottom: 1px solid var(--lp-border);
		font-size: 0.75rem;
		font-family: var(--lp-sans);
		color: var(--lp-mid);
	}

	.lp-vis-url-icon {
		font-size: 0.8125rem;
	}

	.lp-vis-public-badge {
		margin-left: auto;
		font-size: 0.5625rem;
		font-weight: 700;
		font-family: var(--lp-sans);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #16a34a;
		background: #dcfce7;
		padding: 2px 8px;
		border-radius: 10px;
	}

	.lp-vis-public-tasks {
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		gap: 0.1875rem;
	}

	.lp-vis-pub-task {
		display: flex;
		align-items: center;
		gap: 0.5625rem;
		padding: 0.5625rem 0.6875rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-family: var(--lp-sans);
		color: var(--lp-mid);
		transition: background 0.15s;
	}

	.lp-vis-pub-task:hover {
		background: var(--lp-paper);
	}

	.lp-vis-pub-task--active {
		background: #fff7ed;
		color: var(--lp-ink);
	}

	.lp-vis-pub-task--active em {
		color: var(--lp-accent);
		font-style: normal;
		font-size: 0.6875rem;
	}

	.lp-vis-pub-task--done {
		opacity: 0.45;
	}

	.lp-vis-pub-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* ── How it works ──────────────────────────────── */
	.lp-how {
		background: var(--lp-warm);
		padding: 6rem var(--lp-px);
	}

	.lp-how-inner {
		max-width: var(--lp-max);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 3.5rem;
	}

	.lp-how-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.lp-how-heading {
		font-family: var(--lp-display);
		font-size: clamp(2rem, 3.5vw, 3rem);
		font-weight: 400;
		line-height: 1.1;
		letter-spacing: -0.025em;
		color: var(--lp-ink);
		margin: 0;
	}

	.lp-how-heading em {
		font-style: italic;
		color: var(--lp-accent);
	}

	.lp-how-steps {
		display: grid;
		grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
		align-items: start;
		gap: 0;
	}

	.lp-step {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.lp-step-num {
		font-family: var(--lp-display);
		font-size: 2.5rem;
		font-weight: 300;
		color: var(--lp-border);
		line-height: 1;
		letter-spacing: -0.04em;
	}

	.lp-step-title {
		font-size: 0.9375rem;
		font-weight: 600;
		font-family: var(--lp-sans);
		color: var(--lp-ink);
		margin: 0;
		line-height: 1.3;
	}

	.lp-step-desc {
		font-size: 0.875rem;
		line-height: 1.65;
		color: var(--lp-muted);
		margin: 0;
		font-family: var(--lp-sans);
	}

	.lp-step-arrow {
		padding: 1rem 0.75rem 0;
		color: var(--lp-border);
		font-size: 1.125rem;
		font-weight: 300;
		align-self: start;
		font-family: var(--lp-sans);
	}

	/* ── CTA ───────────────────────────────────────── */
	.lp-cta {
		background: var(--lp-dark);
		padding: 7rem var(--lp-px);
	}

	.lp-cta-inner {
		max-width: var(--lp-max);
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.lp-cta-text {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.lp-cta-heading {
		font-family: var(--lp-display);
		font-size: clamp(2.75rem, 5vw, 4.5rem);
		font-weight: 400;
		line-height: 1.07;
		letter-spacing: -0.03em;
		color: #fff;
		margin: 0;
	}

	.lp-cta-heading em {
		font-style: italic;
		color: var(--lp-accent);
	}

	.lp-cta-action {
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
		align-items: flex-start;
	}

	.lp-cta-action > p {
		font-size: 0.9375rem;
		color: rgba(255, 255, 255, 0.35);
		font-family: var(--lp-sans);
		margin: 0;
	}

	/* ── Footer ────────────────────────────────────── */
	.lp-footer {
		background: var(--lp-ink-2);
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding: 2.5rem var(--lp-px);
	}

	.lp-footer-inner {
		max-width: var(--lp-max);
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.lp-footer-left {
		display: flex;
		flex-direction: column;
		gap: 0.3125rem;
	}

	.lp-footer-logo {
		font-family: var(--lp-display);
		font-size: 1.125rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.85);
		letter-spacing: -0.02em;
	}

	.lp-footer-left p {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.3);
		font-family: var(--lp-sans);
		margin: 0;
	}

	.lp-footer-right {
		text-align: right;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.lp-footer-right p {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.2);
		font-family: var(--lp-sans);
		margin: 0;
	}

	.lp-footer-copy {
		color: rgba(255, 255, 255, 0.12) !important;
	}

	/* ── Responsive: Tablet ────────────────────────── */
	@media (max-width: 900px) {
		.lp-how-steps {
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
		}

		.lp-step-arrow {
			display: none;
		}
	}

	/* ── Responsive: Mobile ────────────────────────── */
	@media (max-width: 768px) {
		.lp-nav-links {
			display: none;
		}

		.lp-hero-grid {
			grid-template-columns: 1fr;
			padding: 3rem var(--lp-px) 4rem;
			gap: 3rem;
			min-height: unset;
		}

		.lp-hero {
			min-height: unset;
		}

		.lp-board {
			transform: none;
		}

		.lp-statement {
			padding: 4rem var(--lp-px);
		}

		.lp-statement-inner {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.lp-feature {
			grid-template-columns: 1fr;
			gap: 2.5rem;
			padding: 3.5rem var(--lp-px);
		}

		.lp-feature--reverse .lp-feature-text,
		.lp-feature--reverse .lp-feature-visual {
			order: unset;
		}

		.lp-feature-num {
			font-size: 3rem;
		}

		.lp-how {
			padding: 4rem var(--lp-px);
		}

		.lp-how-steps {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.lp-cta {
			padding: 5rem var(--lp-px);
		}

		.lp-cta-inner {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.lp-footer-inner {
			flex-direction: column;
			align-items: flex-start;
		}

		.lp-footer-right {
			text-align: left;
		}

		.lp-pricing {
			padding: 4rem var(--lp-px);
		}

		.lp-plans {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.lp-plan--featured {
			margin-top: 0;
			margin-bottom: 0;
			padding-top: 2rem;
			padding-bottom: 2rem;
			order: -1; /* Show featured plan first on mobile */
		}
	}

	/* ── Pricing ───────────────────────────────────── */
	.lp-pricing {
		background: var(--lp-warm);
		padding: 6rem var(--lp-px);
	}

	.lp-pricing-inner {
		max-width: var(--lp-max);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 3.5rem;
	}

	.lp-pricing-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.lp-pricing-heading {
		font-family: var(--lp-display);
		font-size: clamp(2rem, 3.5vw, 3rem);
		font-weight: 400;
		line-height: 1.1;
		letter-spacing: -0.025em;
		color: var(--lp-ink);
		margin: 0;
	}

	.lp-pricing-heading em {
		font-style: italic;
		color: var(--lp-accent);
	}

	.lp-pricing-sub {
		font-size: 1rem;
		color: var(--lp-muted);
		font-family: var(--lp-sans);
		margin: 0;
	}

	.lp-plans {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		align-items: stretch;
		gap: 1.25rem;
	}

	.lp-plan {
		background: #fff;
		border: 1px solid var(--lp-border);
		border-radius: 14px;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		position: relative;
		transition: box-shadow 0.2s;
	}

	.lp-plan:hover {
		box-shadow: 0 8px 32px rgba(28, 25, 23, 0.08);
	}

	.lp-plan--featured {
		background: var(--lp-ink);
		border-color: var(--lp-ink);
		margin-top: -1.5rem;
		margin-bottom: -1.5rem;
		padding-top: 3.5rem;
		padding-bottom: 3.5rem;
		box-shadow: 0 8px 48px rgba(28, 25, 23, 0.18);
	}

	.lp-plan--featured:hover {
		box-shadow: 0 12px 56px rgba(28, 25, 23, 0.24);
	}

	.lp-plan-badge {
		position: absolute;
		top: 1.75rem;
		right: 1.5rem;
		font-size: 0.5625rem;
		font-weight: 700;
		font-family: var(--lp-sans);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--lp-accent);
		background: rgba(192, 86, 33, 0.15);
		padding: 4px 10px;
		border-radius: 20px;
		border: 1px solid rgba(192, 86, 33, 0.3);
	}

	.lp-plan-header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.lp-plan-name {
		font-family: var(--lp-display);
		font-size: 1.75rem;
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.02em;
		color: var(--lp-ink);
		margin: 0;
	}

	.lp-plan--featured .lp-plan-name {
		color: #fff;
	}

	.lp-plan-price {
		font-family: var(--lp-display);
		font-size: 2.25rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--lp-ink);
	}

	.lp-plan--featured .lp-plan-price {
		color: #fff;
	}

	.lp-plan-period {
		font-size: 0.8125rem;
		font-family: var(--lp-sans);
		color: var(--lp-muted);
		font-weight: 400;
	}

	.lp-plan--featured .lp-plan-period {
		color: rgba(255, 255, 255, 0.4);
	}

	.lp-plan-desc {
		font-size: 0.9rem;
		line-height: 1.6;
		font-family: var(--lp-sans);
		color: var(--lp-mid);
		margin: 0;
	}

	.lp-plan--featured .lp-plan-desc {
		color: rgba(255, 255, 255, 0.55);
	}

	.lp-plan-specs {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		border-top: 1px solid var(--lp-border);
		border-bottom: 1px solid var(--lp-border);
	}

	.lp-plan--featured .lp-plan-specs {
		border-color: rgba(255, 255, 255, 0.1);
	}

	.lp-plan-specs li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.625rem 0;
		border-bottom: 1px solid var(--lp-border);
	}

	.lp-plan--featured .lp-plan-specs li {
		border-color: rgba(255, 255, 255, 0.08);
	}

	.lp-plan-specs li:last-child {
		border-bottom: none;
	}

	.lp-spec-k {
		font-size: 0.8125rem;
		font-family: var(--lp-sans);
		color: var(--lp-muted);
		font-weight: 400;
		flex-shrink: 0;
	}

	.lp-plan--featured .lp-spec-k {
		color: rgba(255, 255, 255, 0.4);
	}

	.lp-spec-v {
		font-size: 0.875rem;
		font-family: var(--lp-sans);
		color: var(--lp-ink);
		font-weight: 500;
		text-align: right;
	}

	.lp-plan--featured .lp-spec-v {
		color: #fff;
	}

	.lp-plan-divider {
		display: none; /* specs handle the visual separation already */
	}

	.lp-plan-features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.lp-plan-feat {
		font-size: 0.875rem;
		font-family: var(--lp-sans);
		color: var(--lp-mid);
		font-weight: 400;
		line-height: 1.4;
	}

	.lp-plan--featured .lp-plan-feat {
		color: rgba(255, 255, 255, 0.7);
	}

	.lp-plan-action {
		margin-top: auto;
	}

	.lp-plan-btn {
		display: block;
		width: 100%;
		text-align: center;
		text-decoration: none;
		font-size: 0.9375rem;
		font-weight: 600;
		font-family: var(--lp-sans);
		padding: 0.75rem 1.25rem;
		border-radius: var(--lp-radius);
		border: 1.5px solid var(--lp-border);
		color: var(--lp-ink);
		background: transparent;
		transition:
			background 0.15s,
			border-color 0.15s,
			transform 0.15s;
	}

	.lp-plan-btn:hover {
		background: var(--lp-warm);
		border-color: var(--lp-mid);
		transform: translateY(-1px);
	}

	.lp-plan-btn--featured {
		background: var(--lp-accent);
		border-color: var(--lp-accent);
		color: #fff;
	}

	.lp-plan-btn--featured:hover {
		background: #a84a1a;
		border-color: #a84a1a;
		transform: translateY(-1px);
	}

	/* ── Responsive: Small mobile ──────────────────── */
	@media (max-width: 480px) {
		:root {
			--lp-px: 1.25rem;
		}

		.lp-hero-actions {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.875rem;
		}

		/* Show only 2 kanban columns on very small screens */
		.lp-board-cols {
			grid-template-columns: 1fr 1fr;
		}

		.lp-board-cols .lp-col:last-child {
			display: none;
		}
	}
</style>
