<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

let { form }: { form: ActionData } = $props();
const message = $derived(form?.message ?? '');
</script>

<svelte:head>
	<title>Papanin — Masuk atau Daftar</title>
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 flex items-center justify-center px-4 py-16"
>
	<div class="max-w-5xl w-full grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
		<section
			class="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100/70 backdrop-blur supports-[backdrop-filter]:bg-base-100/50 p-10 shadow-xl"
		>
			<div class="absolute inset-0 pointer-events-none opacity-60">
				<div class="absolute -top-24 -right-12 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
				<div class="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"></div>
			</div>
			<div class="relative space-y-6 text-base-content">
				<span class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
					Ruang Kerja Papanin
				</span>
				<h1 class="text-4xl font-extrabold leading-tight sm:text-5xl">
					Selamat datang kembali di
					<span class="text-primary">Papanin</span>
				</h1>
				<p class="text-base-content/70 text-lg max-w-xl">
					Rencanakan, lacak, dan selesaikan proyek tim Anda dalam satu platform. Masuk untuk melanjutkan pekerjaan atau mulai papan baru dalam hitungan detik.
				</p>
				<ul class="space-y-3 text-base-content/80">
					<li class="flex items-start gap-3">
						<span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-sm text-primary">1</span>
						<div>
							<p class="font-semibold">Pengalaman Kanban terpadu</p>
							<p class="text-sm text-base-content/70">Atur tugas, status, dan alur kerja sesuai kebutuhan tim Anda.</p>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary/15 text-sm text-secondary">2</span>
						<div>
							<p class="font-semibold">Undang kolaborator seketika</p>
							<p class="text-sm text-base-content/70">Bagikan papan publik atau buat ruang kerja privat untuk tim Anda.</p>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-sm text-accent">3</span>
						<div>
							<p class="font-semibold">Tetap seragam dengan merek</p>
							<p class="text-sm text-base-content/70">Papanin menjaga papan Anda tetap rapi sehingga tim fokus pada prioritas.</p>
						</div>
					</li>
				</ul>
				<div>
					<a href="/" class="btn btn-ghost btn-sm text-base-content/70">Jelajahi beranda</a>
				</div>
			</div>
		</section>

		<section>
			<div class="card bg-base-100/95 shadow-2xl border border-base-300">
				<div class="card-body space-y-6">
					<header class="space-y-2 text-center">
						<h2 class="text-3xl font-bold text-base-content">Selamat datang di Papanin</h2>
						<p class="text-sm text-base-content/70">Masuk untuk melanjutkan pekerjaan atau daftar akun baru menggunakan email Anda.</p>
					</header>
					{#if message}
						<div role="alert" class="alert alert-error text-sm">
							<span>{message}</span>
						</div>
					{/if}
					<div class="space-y-6">
						<form method="post" action="?/login" use:enhance class="space-y-4">
							<h3 class="text-lg font-semibold text-base-content">Masuk</h3>
							<label class="form-control w-full">
								<span class="label-text font-semibold">Nama pengguna</span>
								<input
									autocomplete="username"
									autocapitalize="none"
									autocorrect="off"
									name="username"
									required
									class="input input-bordered input-md w-full"
									placeholder="kamu@papanin"
								/>
							</label>
							<label class="form-control w-full">
								<span class="label-text font-semibold">Kata sandi</span>
								<input
									name="password"
									type="password"
									autocomplete="current-password"
									required
									class="input input-bordered input-md w-full"
									placeholder="••••••••"
								/>
							</label>
							<button type="submit" class="btn btn-primary w-full">Masuk ke Papanin</button>
						</form>
						<div class="divider text-xs uppercase text-base-content/60">atau</div>
						<form method="post" action="?/register" use:enhance class="space-y-4">
							<h3 class="text-lg font-semibold text-base-content">Buat akun baru</h3>
							<label class="form-control w-full">
								<span class="label-text font-semibold">Nama pengguna</span>
								<input
									autocomplete="username"
									autocapitalize="none"
									autocorrect="off"
									name="username"
									required
									class="input input-bordered input-md w-full"
									placeholder="kamu@papanin"
								/>
							</label>
							<label class="form-control w-full">
								<span class="label-text font-semibold">Email</span>
								<input
									name="email"
									type="email"
									autocomplete="email"
									required
									class="input input-bordered input-md w-full"
									placeholder="nama@perusahaan.com"
								/>
							</label>
							<label class="form-control w-full">
								<span class="label-text font-semibold">Kata sandi</span>
								<input
									name="password"
									type="password"
									autocomplete="new-password"
									required
									class="input input-bordered input-md w-full"
									placeholder="Minimal 6 karakter"
								/>
							</label>
							<button type="submit" class="btn btn-outline w-full">Daftar dan mulai</button>
						</form>
					</div>
					<p class="text-xs text-base-content/60 text-center">
						Dengan melanjutkan, Anda menyetujui pedoman komunitas dan ketentuan layanan Papanin.
					</p>
				</div>
			</div>
		</section>
	</div>
</div>
