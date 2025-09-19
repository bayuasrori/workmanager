<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="space-y-6 p-4">
	<section class="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-700 px-6 py-6 shadow-xl text-emerald-50">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="text-3xl font-extrabold">Daftar Organisasi</h1>
				<p class="text-sm text-emerald-100/80">
					Kelola workspace, undang anggota baru, dan atur kepemilikan organisasi Anda di sini.
				</p>
			</div>
			<a
				href="/org/create"
				class="btn border-none bg-amber-300 text-emerald-900 hover:bg-amber-200 font-semibold px-6"
			>
				➕ Buat Organisasi
			</a>
		</div>
		<div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-emerald-100/85">
			<span class="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1">
				<span class="text-lg">🏢</span>
				<span>{data.organizations.length} organisasi personal</span>
			</span>
			<span class="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1">
				<span class="text-lg">👤</span>
				<span>Anda hanya melihat organisasi tempat Anda terdaftar</span>
			</span>
		</div>
	</section>

	<section class="hidden overflow-x-auto rounded-3xl border border-emerald-200 bg-white shadow-lg lg:block">
		<table class="table w-full">
			<thead class="bg-emerald-50 text-emerald-900">
				<tr class="text-sm uppercase tracking-wide">
					<th class="py-4">Nama Organisasi</th>
					<th>Owner</th>
					<th class="w-40 text-center">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.organizations as org (org.id)}
					<tr class="border-b border-emerald-50 hover:bg-emerald-50/60 transition-colors">
						<td class="py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
									{org.name?.[0]?.toUpperCase() ?? 'O'}
								</div>
								<div>
									<p class="font-semibold text-emerald-900">{org.name}</p>
									<p class="text-xs text-emerald-700/70">ID: {org.id}</p>
								</div>
							</div>
						</td>
						<td class="text-emerald-800">
							<span class="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700 border border-emerald-200">
								👤 {org.ownerId ?? 'Tidak ditentukan'}
							</span>
						</td>
						<td>
							<div class="flex items-center justify-center gap-2">
								<a
									href="/org/{org.id}"
									class="btn btn-sm border border-emerald-400 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
								>
									Edit
								</a>
								<form method="POST" action="?/delete&id={org.id}" class="contents">
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

	<section class="grid gap-3 lg:hidden">
		{#each data.organizations as org (org.id)}
			<article class="rounded-2xl border border-emerald-200 bg-white shadow-md p-4">
				<header class="flex items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
							{org.name?.[0]?.toUpperCase() ?? 'O'}
						</div>
						<div>
							<h3 class="text-lg font-semibold text-emerald-900">{org.name}</h3>
							<p class="text-xs text-emerald-700/70">Owner: {org.ownerId ?? '-'}</p>
						</div>
					</div>
				</header>
				<footer class="mt-4 flex flex-wrap gap-2">
					<a
						href="/org/{org.id}"
						class="btn btn-sm flex-1 border border-emerald-400 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
					>
						Edit
					</a>
					<form method="POST" action="?/delete&id={org.id}" class="flex-1">
						<button class="btn btn-sm w-full bg-emerald-600 text-emerald-50 border-none hover:bg-emerald-700">
							Delete
						</button>
					</form>
				</footer>
			</article>
		{/each}
	</section>
</div>
