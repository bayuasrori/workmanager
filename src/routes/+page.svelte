<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<!-- Navigation Header -->
<nav class="navbar bg-base-100 shadow-lg sticky top-0 z-50 backdrop-blur supports-backdrop-blur:bg-base-100/90">
	<div class="navbar-start">
		<div class="dropdown lg:hidden">
			<button class="btn btn-ghost btn-circle" tabindex="0" type="button" aria-label="Menu">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-5 w-5 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<ul class="menu menu-sm dropdown-content mt-3 w-52 rounded-box bg-base-100 p-2 shadow">
				<li><a href="#features">Fitur</a></li>
				<li><a href="#pricing">Harga</a></li>
				<li><a href="#tech">Teknologi</a></li>
				<li><a href="#cta">Mulai</a></li>
			</ul>
		</div>
		<a href="/" class="btn btn-ghost text-xl font-bold text-primary">Papanin</a>
	</div>
	<div class="navbar-center hidden lg:flex gap-3">
		<a href="#features" class="btn btn-ghost normal-case">Fitur</a>
		<a href="#pricing" class="btn btn-ghost normal-case">Harga</a>
		<a href="#tech" class="btn btn-ghost normal-case">Teknologi</a>
		<a href="#cta" class="btn btn-ghost normal-case">Mulai</a>
	</div>
	<div class="navbar-end gap-2">
		{#if data.isAuthenticated}
			<a href="/dashboard" class="btn btn-primary">Buka Dashboard</a>
		{:else}
			<a href="/login" class="btn btn-primary">Mulai Sekarang</a>
		{/if}
	</div>
</nav>

<!-- Hero Section -->
<section class="hero min-h-screen landing-hero">
	<div class="hero-overlay landing-hero__overlay"></div>
	<div class="hero-content text-center">
		<div class="max-w-md landing-hero__card">
			<h1 class="text-5xl font-bold text-base-content mb-6">
				Satu <span class="text-primary">Papan</span>, Banyak Ide.
			</h1>
			<p class="text-lg text-base-content/70 mb-8">
				Kerjaan bisa ditunda, tapi nyatet ide jangan sampai kelewat. Papanin dulu aja, biar nggak
				numpuk di kepala apalagi di chat grup.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				{#if data.isAuthenticated}
					<a href="/dashboard" class="btn btn-primary btn-lg">Buka Dashboard</a>
				{:else}
					<a href="/login" class="btn btn-primary btn-lg">Coba Gratis Sekarang</a>
				{/if}
				<a href="/public-board/create" class="btn btn-accent btn-lg">Buat Papan Publik</a>
				<a href="#features" class="btn btn-warning btn-lg">Lihat Fitur</a>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section id="features" class="py-20 bg-base-100">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<h2 class="text-4xl font-bold text-base-content mb-4">Fitur Unggulan Kami</h2>
			<p class="text-lg text-base-content/70 max-w-2xl mx-auto">
				Semua yang kamu perlukan untuk mengelola pekerjaan dengan rapi dan menjaga tim tetap
				teratur.
			</p>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
			<!-- Feature 1 -->
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body text-center">
					<div class="text-4xl mb-4">👥</div>
					<h3 class="card-title justify-center mb-2">Kelola Tim</h3>
					<p class="text-base-content/70">
						Buat dan kelola organisasi dengan pengaturan peran yang jelas. Undang anggota tim dan
						atur hak aksesnya.
					</p>
				</div>
			</div>

			<!-- Feature 2 -->
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body text-center">
					<div class="text-4xl mb-4">📋</div>
					<h3 class="card-title justify-center mb-2">Pantau Proyek</h3>
					<p class="text-base-content/70">
						Susun pekerjaan dalam proyek dan pantau progres dengan status tugas serta tenggat yang
						bisa kamu atur sendiri.
					</p>
				</div>
			</div>

			<!-- Feature 3 -->
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body text-center">
					<div class="text-4xl mb-4">✅</div>
					<h3 class="card-title justify-center mb-2">Kelola Tugas</h3>
					<p class="text-base-content/70">
						Buat, bagi, dan pantau tugas lengkap dengan komentar, pembaruan status, dan kolaborasi
						langsung.
					</p>
				</div>
			</div>

			<!-- Feature 4 -->
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body text-center">
					<div class="text-4xl mb-4">🌐</div>
					<h3 class="card-title justify-center mb-2">Papan Publik</h3>
					<p class="text-base-content/70">
						Buat papan publik gratis untuk dibagikan ke siapa saja. Cocok untuk proyek terbuka dan
						kolaborasi komunitas.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="py-20 bg-base-200">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<h2 class="text-4xl font-bold text-base-content mb-4">Pilih Paket Sesuai Kebutuhan</h2>
			<p class="text-lg text-base-content/70 max-w-2xl mx-auto">
				Mulai dari papan publik gratis sampai kolaborasi skala perusahaan, tinggal pilih paket yang
				sesuai ritme tim kamu.
			</p>
		</div>
		<div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 xl:grid-cols-3">
			<div class="card bg-base-100 shadow-xl border border-base-300/70 transition hover:-translate-y-1 hover:shadow-2xl">
				<div class="card-body gap-6">
					<div>
						<h3 class="text-3xl font-bold text-base-content">Free</h3>
						<p class="text-sm text-base-content/60">Rp0 selamanya</p>
					</div>
					<p class="text-sm text-base-content/70">
						Untuk kreator solo dan komunitas yang butuh papan gratis tapi tetap rapi dan mudah diajak
						berkolaborasi.
					</p>
					<ul class="space-y-3 text-sm text-base-content/80">
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Buat papan publik tanpa batas dan bagikan link ke siapa pun</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Status tugas, komentar, dan aktivitas real-time</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Papan privat untuk tim internal kecil</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Maksimal 10 anggota dalam satu ruang kerja</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Belum mendukung organisasi dan proyek terpisah</span>
						</li>
					</ul>
				</div>
			</div>
			<div class="card shadow-2xl border-none bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-content transition hover:-translate-y-1 hover:shadow-2xl">
				<div class="card-body gap-6">
					<div class="flex items-center gap-3">
						<div class="badge badge-secondary badge-lg">Terpopuler</div>
						<p class="text-xs uppercase tracking-wide opacity-80">Tim bertumbuh</p>
					</div>
					<div>
						<h3 class="text-3xl font-bold">Team</h3>
						<p class="text-sm opacity-90">Rp50.000 / bulan</p>
					</div>
					<p class="text-sm opacity-90">
						Skala kolaborasi dengan kontrol organisasi, cocok untuk startup atau tim lintas divisi
						kecil.
					</p>
					<ul class="space-y-3 text-sm opacity-90">
						<li class="flex items-start gap-3">
							<span class="mt-0.5 text-secondary" aria-hidden="true">✔</span>
							<span>Tambah hingga 5 organisasi</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="mt-0.5 text-secondary" aria-hidden="true">✔</span>
							<span>Maksimal 5 proyek per organisasi</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="mt-0.5 text-secondary" aria-hidden="true">✔</span>
							<span>Hingga 10 anggota aktif per proyek</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="mt-0.5 text-secondary" aria-hidden="true">✔</span>
							<span>Papan privat dan publik tanpa batas</span>
						</li>
					</ul>
				</div>
			</div>
			<div class="card bg-base-100 shadow-xl border border-primary/60 transition hover:-translate-y-1 hover:shadow-2xl">
				<div class="card-body gap-6">
					<div>
						<h3 class="text-3xl font-bold text-base-content">Enterprise</h3>
						<p class="text-sm text-base-content/60">Rp150.000 / bulan</p>
					</div>
					<p class="text-sm text-base-content/70">
						Untuk organisasi mapan yang butuh struktur lebih kompleks, dukungan prioritas, dan skala
						anggotanya besar.
					</p>
					<ul class="space-y-3 text-sm text-base-content/80">
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Tambah hingga 10 organisasi</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Hingga 100 anggota dalam satu organisasi</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Akses papan publik dan privat tanpa batas</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-primary" aria-hidden="true">✔</span>
							<span>Dukungan onboarding dan pengaturan lanjutan</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Tech Stack Section -->
<section id="tech" class="py-20 bg-base-200">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<h2 class="text-4xl font-bold text-base-content mb-4">Didukung Teknologi Terkini</h2>
			<p class="text-lg text-base-content/70 max-w-2xl mx-auto">
				Dibangun dengan teknologi modern agar aplikasi tetap cepat, stabil, dan nyaman digunakan.
			</p>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body text-center">
					<div class="text-2xl font-bold text-primary mb-2">SvelteKit</div>
					<p class="text-sm text-base-content/70">Framework web modern</p>
				</div>
			</div>

			<div class="card bg-base-100 shadow-lg">
				<div class="card-body text-center">
					<div class="text-2xl font-bold text-primary mb-2">Drizzle ORM</div>
					<p class="text-sm text-base-content/70">Basis data yang aman dan konsisten</p>
				</div>
			</div>

			<div class="card bg-base-100 shadow-lg">
				<div class="card-body text-center">
					<div class="text-2xl font-bold text-primary mb-2">Tailwind CSS</div>
					<p class="text-sm text-base-content/70">Gaya antarmuka yang fleksibel</p>
				</div>
			</div>

			<div class="card bg-base-100 shadow-lg">
				<div class="card-body text-center">
					<div class="text-2xl font-bold text-primary mb-2">Oslo Auth</div>
					<p class="text-sm text-base-content/70">Autentikasi yang aman</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section id="cta" class="py-20 bg-primary text-primary-content">
	<div class="container mx-auto px-4 text-center">
		<h2 class="text-4xl font-bold mb-4">Siap Mulai Sekarang?</h2>
		<p class="text-xl mb-8 opacity-90">
			Bergabunglah dengan banyak tim yang sudah memakai Papanin untuk merapikan pekerjaan mereka.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			{#if data.isAuthenticated}
				<a href="/dashboard" class="btn btn-secondary btn-lg">Buka Dashboard</a>
			{:else}
				<a href="/login" class="btn btn-secondary btn-lg">Mulai Coba Gratis</a>
			{/if}
			<a href="/public-board/create" class="btn btn-accent btn-lg">Buat Papan Publik</a>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="footer footer-center p-10 bg-base-200 text-base-content">
	<div>
		<p class="font-bold text-lg">Papanin</p>
		<p class="text-base-content/70">Permudah pekerjaanmu, rapikan kerja tim.</p>
		<p class="text-sm text-base-content/50 mt-4">
			Dibuat dengan ❤️ menggunakan SvelteKit, Drizzle ORM, dan Tailwind CSS
		</p>
	</div>
</footer>

<style>
	.landing-hero {
		position: relative;
		background-image: url('/chalkboard-notes-bg.svg');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.landing-hero__overlay {
		background: linear-gradient(135deg, rgba(15, 23, 42, 0.65), rgba(30, 64, 175, 0.35));
		backdrop-filter: blur(1px);
	}

	.landing-hero__card {
		background: rgba(255, 255, 255, 0.86);
		backdrop-filter: blur(6px);
		border-radius: 1.5rem;
		padding: 2.5rem 2rem;
		box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
	}

	:global(.dark) .landing-hero__card {
		background: rgba(15, 23, 42, 0.85);
		box-shadow: 0 25px 60px rgba(2, 6, 23, 0.45);
	}

	:global(.dark) .landing-hero {
		background-color: #020617;
		background-blend-mode: lighten;
	}

	:global(.dark) .landing-hero__overlay {
		background: linear-gradient(135deg, rgba(2, 6, 23, 0.82), rgba(30, 41, 59, 0.6));
	}

	@media (max-width: 768px) {
		.landing-hero {
			background-position: center top;
		}
	}
</style>
