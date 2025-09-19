<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="space-y-6 p-4">
	<section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-700 px-6 py-7 shadow-xl text-emerald-50">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="text-3xl font-extrabold">Manajemen Pengguna</h1>
				<p class="text-sm text-emerald-100/80">Kelola akun tim Anda, perbarui informasi, dan atur akses dengan mudah.</p>
			</div>
			<a
				href="/user/create"
				class="btn border-none bg-amber-300 text-emerald-900 hover:bg-amber-200 font-semibold px-6"
			>
				➕ Tambah Pengguna
			</a>
		</div>
		<div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-emerald-100/80">
			<span class="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1">
				<span class="text-lg">👥</span>
				<span>{data.users.length} pengguna terdaftar</span>
			</span>
			<span class="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1">
				<span class="text-lg">📧</span>
				<span>Email terverifikasi otomatis saat registrasi</span>
			</span>
		</div>
	</section>

	<!-- Desktop table -->
	<section class="hidden overflow-x-auto rounded-3xl border border-emerald-200 bg-white shadow-lg lg:block">
		<table class="table w-full">
			<thead class="bg-emerald-50 text-emerald-900">
				<tr class="text-sm uppercase tracking-wide">
					<th class="py-4">Username</th>
					<th>Email</th>
					<th class="text-center">Age</th>
					<th class="w-40 text-center">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user (user.id)}
					<tr class="border-b border-emerald-50 hover:bg-emerald-50/60 transition-colors">
						<td class="py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
									{user.username?.[0]?.toUpperCase() ?? '?'}
								</div>
								<div>
									<p class="font-semibold text-emerald-900">{user.username}</p>
									<p class="text-xs text-emerald-700/70">ID: {user.id}</p>
								</div>
							</div>
						</td>
						<td class="text-emerald-800">{user.email}</td>
						<td class="text-center text-emerald-700">{user.age ?? '-'}</td>
						<td>
							<div class="flex items-center justify-center gap-2">
								<a
									href="/user/{user.id}"
									class="btn btn-sm border border-emerald-400 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
								>
									Edit
								</a>
								<form method="POST" action="?/delete&id={user.id}" class="contents">
									<button class="btn btn-sm bg-emerald-600 text-emerald-50 border-none hover:bg-emerald-700">
										Delete
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<!-- Mobile cards -->
	<section class="grid gap-3 lg:hidden">
		{#each data.users as user (user.id)}
			<article class="rounded-2xl border border-emerald-200 bg-white shadow-md p-4">
				<header class="flex items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
							{user.username?.[0]?.toUpperCase() ?? '?'}
						</div>
						<div>
							<h3 class="text-lg font-semibold text-emerald-900">{user.username}</h3>
							<p class="text-xs text-emerald-700/70">{user.email}</p>
						</div>
					</div>
					<span class="badge bg-emerald-100 text-emerald-700 border-emerald-200">Age: {user.age ?? '-'}</span>
				</header>
				<footer class="mt-4 flex flex-wrap gap-2">
					<a
						href="/user/{user.id}"
						class="btn btn-sm flex-1 border border-emerald-400 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
					>
						Edit
					</a>
					<form method="POST" action="?/delete&id={user.id}" class="flex-1">
						<button class="btn btn-sm w-full bg-emerald-600 text-emerald-50 border-none hover:bg-emerald-700">
							Delete
						</button>
					</form>
				</footer>
			</article>
		{/each}
	</section>
</div>
