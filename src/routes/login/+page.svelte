<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import { setFlashToast } from '$lib/toast.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state<'login' | 'register' | null>(null);
	let redirecting = $state(false);
	let networkError = $state('');

	type FormValues = { username?: string; email?: string };

	function valuesFor(intent: 'login' | 'register'): FormValues {
		return untrack(() =>
			form?.intent === intent ? (form?.values as FormValues | undefined) ?? {} : {}
		);
	}

	let loginUsername = $state(valuesFor('login').username ?? '');
	let regUsername = $state(valuesFor('register').username ?? '');
	let regEmail = $state(valuesFor('register').email ?? '');

	type FieldErrors = { username?: string; password?: string; email?: string };

	const loginFieldErrors = $derived<FieldErrors>(
		form?.intent === 'login' ? form?.fieldErrors ?? {} : {}
	);
	const loginMessage = $derived<string>(form?.intent === 'login' ? form?.message ?? '' : '');
	const regFieldErrors = $derived<FieldErrors>(
		form?.intent === 'register' ? form?.fieldErrors ?? {} : {}
	);
	const regMessage = $derived<string>(form?.intent === 'register' ? form?.message ?? '' : '');

	const busy = $derived(submitting !== null || redirecting);

	function submitHandler(intent: 'login' | 'register'): SubmitFunction {
		return () => {
			submitting = intent;
			networkError = '';
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					redirecting = true;
					setFlashToast(
						'success',
						intent === 'login' ? 'Berhasil masuk!' : 'Akun berhasil dibuat!'
					);
					await update();
					return;
				}
				if (result.type === 'error') {
					networkError = 'Koneksi bermasalah atau server sedang error. Coba lagi sebentar.';
					submitting = null;
					return;
				}
				await update({ reset: false });
				submitting = null;
			};
		};
	}

	function clearNetworkError() {
		if (networkError) networkError = '';
	}
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
					{#if networkError}
						<div role="alert" class="alert alert-error text-sm">
							<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							<span>{networkError}</span>
						</div>
					{/if}
					<div class="space-y-6">
						<form
							method="post"
							action="?/login"
							use:enhance={submitHandler('login')}
							class="space-y-4"
						>
							<h3 class="text-lg font-semibold text-base-content">Masuk</h3>
							{#if loginMessage}
								<div role="alert" class="alert alert-error text-sm">
									<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									<span>{loginMessage}</span>
								</div>
							{/if}
							<label class="form-control w-full">
								<span class="label-text font-semibold">Nama pengguna</span>
								<input
									autocomplete="username"
									autocapitalize="none"
									autocorrect="off"
									name="username"
									required
									bind:value={loginUsername}
									oninput={clearNetworkError}
									disabled={busy}
									aria-invalid={!!loginFieldErrors.username}
									class="input input-bordered input-md w-full {loginFieldErrors.username ? 'input-error' : ''}"
									placeholder="kamu@papanin"
								/>
								{#if loginFieldErrors.username}
									<span class="label-text-alt text-error">{loginFieldErrors.username}</span>
								{/if}
							</label>
							<label class="form-control w-full">
								<span class="label-text font-semibold">Kata sandi</span>
								<input
									name="password"
									type="password"
									autocomplete="current-password"
									required
									oninput={clearNetworkError}
									disabled={busy}
									aria-invalid={!!loginFieldErrors.password}
									class="input input-bordered input-md w-full {loginFieldErrors.password ? 'input-error' : ''}"
									placeholder="••••••••"
								/>
								{#if loginFieldErrors.password}
									<span class="label-text-alt text-error">{loginFieldErrors.password}</span>
								{/if}
							</label>
							<button type="submit" class="btn btn-primary w-full" disabled={busy}>
								{#if submitting === 'login'}
									<span class="loading loading-spinner loading-sm"></span>
									{redirecting ? 'Mengarahkan...' : 'Memproses...'}
								{:else}
									Masuk ke Papanin
								{/if}
							</button>
						</form>
						<div class="divider text-xs uppercase text-base-content/60">atau</div>
						<form
							method="post"
							action="?/register"
							use:enhance={submitHandler('register')}
							class="space-y-4"
						>
							<h3 class="text-lg font-semibold text-base-content">Buat akun baru</h3>
							{#if regMessage}
								<div role="alert" class="alert alert-error text-sm">
									<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									<span>{regMessage}</span>
								</div>
							{/if}
							<label class="form-control w-full">
								<span class="label-text font-semibold">Nama pengguna</span>
								<input
									autocomplete="username"
									autocapitalize="none"
									autocorrect="off"
									name="username"
									required
									bind:value={regUsername}
									oninput={clearNetworkError}
									disabled={busy}
									aria-invalid={!!regFieldErrors.username}
									class="input input-bordered input-md w-full {regFieldErrors.username ? 'input-error' : ''}"
									placeholder="kamu@papanin"
								/>
								{#if regFieldErrors.username}
									<span class="label-text-alt text-error">{regFieldErrors.username}</span>
								{/if}
							</label>
							<label class="form-control w-full">
								<span class="label-text font-semibold">Email</span>
								<input
									name="email"
									type="email"
									autocomplete="email"
									required
									bind:value={regEmail}
									oninput={clearNetworkError}
									disabled={busy}
									aria-invalid={!!regFieldErrors.email}
									class="input input-bordered input-md w-full {regFieldErrors.email ? 'input-error' : ''}"
									placeholder="nama@perusahaan.com"
								/>
								{#if regFieldErrors.email}
									<span class="label-text-alt text-error">{regFieldErrors.email}</span>
								{/if}
							</label>
							<label class="form-control w-full">
								<span class="label-text font-semibold">Kata sandi</span>
								<input
									name="password"
									type="password"
									autocomplete="new-password"
									required
									oninput={clearNetworkError}
									disabled={busy}
									aria-invalid={!!regFieldErrors.password}
									class="input input-bordered input-md w-full {regFieldErrors.password ? 'input-error' : ''}"
									placeholder="Minimal 6 karakter"
								/>
								{#if regFieldErrors.password}
									<span class="label-text-alt text-error">{regFieldErrors.password}</span>
								{/if}
							</label>
							<button type="submit" class="btn btn-outline w-full" disabled={busy}>
								{#if submitting === 'register'}
									<span class="loading loading-spinner loading-sm"></span>
									{redirecting ? 'Mengarahkan...' : 'Mendaftar...'}
								{:else}
									Daftar dan mulai
								{/if}
							</button>
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
