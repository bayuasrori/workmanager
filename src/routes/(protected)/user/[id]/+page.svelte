<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getUserDetails, updateUser } from './data.remote';

	const userId = $derived($page.params.id ?? '');
	const data = $derived(await getUserDetails({ userId }));

	let username = $state('');
	let email = $state('');
	let age = $state('');
	let oldPassword = $state('');
	let newPassword = $state('');
	let formMessage = $state('');

	$effect(() => {
		if (!data.user) return;
		username = data.user.username ?? '';
		email = data.user.email ?? '';
		age = data.user.age ? String(data.user.age) : '';
		oldPassword = '';
		newPassword = '';
	});

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		if (!userId) return;
		const trimmedUsername = username.trim();
		const trimmedEmail = email.trim();
		const parsedAge = age ? Number.parseInt(age, 10) : undefined;
		if (!trimmedEmail) {
			formMessage = 'Email diperlukan.';
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
			formMessage = 'Format email tidak valid.';
			return;
		}
		formMessage = '';
		try {
			await updateUser({
				userId,
				username: trimmedUsername,
				email: trimmedEmail,
				age: Number.isNaN(parsedAge) ? undefined : parsedAge,
				oldPassword: oldPassword || undefined,
				newPassword: newPassword || undefined
			});
			await goto('/user');
		} catch (error) {
			console.error('Gagal memperbarui pengguna', error);
			formMessage = 'Gagal memperbarui pengguna. Pastikan nama pengguna dan email belum digunakan.';
		}
	};
</script>

<div class="space-y-6 p-4">
	<section
		class="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-700 px-6 py-6 shadow-xl text-emerald-50"
	>
		<div class="flex flex-col gap-2">
			<h1 class="text-3xl font-extrabold">Perbarui Pengguna</h1>
			<p class="text-sm text-emerald-100/80">
				Edit informasi akun, perbarui alamat email, atau reset kata sandi pengguna ini.
			</p>
		</div>
	</section>

	{#if formMessage}
		<div
			class="rounded-2xl border border-amber-300 bg-amber-100/80 px-4 py-3 text-amber-900 shadow-sm"
		>
			<span>{formMessage}</span>
		</div>
	{/if}

	{#if data.user}
		<section class="rounded-3xl border border-emerald-200 bg-white shadow-lg p-6">
			<form class="space-y-5" onsubmit={handleSubmit}>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<label class="label" for="username">
							<span class="label-text text-emerald-900/80">Username</span>
						</label>
						<input
							type="text"
							id="username"
							bind:value={username}
							class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
							required
						/>
					</div>
					<div>
						<label class="label" for="email">
							<span class="label-text text-emerald-900/80">Email</span>
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
							required
						/>
					</div>
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<label class="label" for="age">
							<span class="label-text text-emerald-900/80">Usia</span>
						</label>
						<input
							type="number"
							id="age"
							bind:value={age}
							class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
						/>
					</div>
					<div
						class="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900/80"
					>
						<p class="font-semibold">Tips keamanan</p>
						<ul class="mt-1 space-y-1 list-disc list-inside">
							<li>Gunakan kata sandi minimal 8 karakter.</li>
							<li>Campurkan huruf besar, angka, dan simbol.</li>
						</ul>
					</div>
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<label class="label" for="oldPassword">
							<span class="label-text text-emerald-900/80">Kata sandi lama</span>
						</label>
						<input
							type="password"
							id="oldPassword"
							bind:value={oldPassword}
							class="input input-bordered w-full bg-white border-emerald-200 focus:border-emerald-400"
						/>
					</div>
					<div>
						<label class="label" for="newPassword">
							<span class="label-text text-emerald-900/80">Kata sandi baru</span>
						</label>
						<input
							type="password"
							id="newPassword"
							bind:value={newPassword}
							class="input input-bordered w-full bg-white border-emerald-200 focus:border-emerald-400"
						/>
					</div>
				</div>
				<div class="flex flex-wrap items-center justify-end gap-3 pt-2">
					<a
						href="/user"
						class="btn border-none bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
					>
						Batal
					</a>
					<button
						type="submit"
						class="btn bg-emerald-600 text-emerald-50 border-none hover:bg-emerald-700"
					>
						Simpan Perubahan
					</button>
				</div>
			</form>
		</section>
	{/if}
</div>
