<script lang="ts">
	type ActionData = {
		message?: string;
		values?: {
			username?: string;
			email?: string;
			age?: string;
		};
	};

	export let form: ActionData | undefined;
</script>

<div class="space-y-6 p-4">
	<section class="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-700 px-6 py-6 shadow-xl text-emerald-50">
		<h1 class="text-3xl font-extrabold">Tambah Pengguna Baru</h1>
		<p class="mt-2 text-sm text-emerald-100/80">
			Isi detail akun untuk mengundang anggota baru bergabung ke workspace Anda.
		</p>
	</section>

	{#if form?.message}
		<div class="rounded-2xl border border-amber-300 bg-amber-100/80 px-4 py-3 text-amber-900 shadow-sm">
			<span>{form.message}</span>
		</div>
	{/if}

	<section class="rounded-3xl border border-emerald-200 bg-white shadow-lg p-6">
		<form method="POST" class="space-y-5">
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="label" for="username">
						<span class="label-text text-emerald-900/80">Username</span>
					</label>
					<input
						type="text"
						id="username"
						name="username"
						class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
						required
						value={form?.values?.username ?? ''}
					/>
				</div>
				<div>
					<label class="label" for="age">
						<span class="label-text text-emerald-900/80">Usia</span>
					</label>
					<input
						type="number"
						id="age"
						name="age"
						class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
						value={form?.values?.age ?? ''}
					/>
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="label" for="email">
						<span class="label-text text-emerald-900/80">Email</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
						required
						value={form?.values?.email ?? ''}
					/>
				</div>
				<div class="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900/80">
					<p class="font-semibold">Email akan digunakan untuk login serta notifikasi.</p>
					<p class="mt-1">Pastikan alamat yang dimasukkan aktif.</p>
				</div>
			</div>
			<div>
				<label class="label" for="password">
					<span class="label-text text-emerald-900/80">Password Awal</span>
				</label>
				<input
					type="text"
					id="password"
					name="password"
					class="input input-bordered w-full bg-white border-emerald-200 focus:border-emerald-400"
					required
				/>
			</div>
			<div class="flex flex-wrap items-center justify-end gap-3 pt-2">
				<a href="/user" class="btn border-none bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
					Batal
				</a>
				<button type="submit" class="btn bg-emerald-600 text-emerald-50 border-none hover:bg-emerald-700">
					Buat Pengguna
				</button>
			</div>
		</form>
	</section>
</div>
