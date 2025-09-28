<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	let boardUrl = '';
	let organizationId = '';
</script>

<svelte:head>
	<title>Impor Papan Publik</title>
</svelte:head>

<div class="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-emerald-50 via-emerald-100 to-amber-50 px-4 py-10">
	<div class="w-full max-w-3xl">
		<div class="mb-6 text-center">
			<p class="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Impor Papan</p>
			<h1 class="mt-2 text-4xl font-extrabold text-emerald-900">Impor Papan Publik</h1>
			<p class="mt-3 text-base text-emerald-800/70">
				Impor papan publik yang sudah ada ke dalam salah satu organisasi Anda.
			</p>
		</div>
		<div class="card shadow-2xl border border-emerald-200/70 bg-white/90 backdrop-blur">
			<div class="card-body p-8">
				<form method="POST" action="?/import" class="grid gap-6">
					<div class="grid gap-2">
						<label class="text-sm font-semibold uppercase tracking-wide text-emerald-900" for="board-url"
							>URL atau Slug Papan Publik</label
						>
						<input
							id="board-url"
							name="boardUrl"
							class="input input-bordered w-full border-emerald-200 bg-white focus:border-emerald-400 focus:ring focus:ring-emerald-100"
							placeholder="https://papanin.com/public-board/slug-papan-publik"
							bind:value={boardUrl}
							required
						/>
					</div>
					<div class="grid gap-2">
						<label class="text-sm font-semibold uppercase tracking-wide text-emerald-900" for="organization-select"
							>Organisasi Tujuan</label
						>
						<select
							id="organization-select"
							name="organizationId"
							class="select select-bordered w-full border-emerald-200 bg-white focus:border-emerald-400 focus:ring focus:ring-emerald-100"
							bind:value={organizationId}
							required
						>
							<option value="" disabled selected>Pilih organisasi</option>
							{#each data.organizations as org (org.id)}
								<option value={org.id}>{org.name}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
						<a href="/dashboard" class="btn btn-ghost text-emerald-600 hover:bg-emerald-100">Batal</a>
						<button
							type="submit"
							class="btn btn-primary bg-emerald-600 border-none hover:bg-emerald-500"
							disabled={!boardUrl.trim() || !organizationId}>Impor</button
						>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
