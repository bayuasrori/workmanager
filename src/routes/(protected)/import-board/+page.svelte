<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	let boardUrl = '';
	let organizationId = '';
</script>

<div class="max-w-2xl mx-auto p-6">
	<h1 class="text-2xl font-bold mb-4">Import Public Board</h1>
	<div class="card bg-base-200 shadow">
		<div class="card-body space-y-4">
			<form method="POST" action="?/import" class="space-y-4">
				<div>
					<label class="label" for="board-url">
						<span class="label-text">Public board URL or slug</span>
					</label>
					<input
						id="board-url"
						name="boardUrl"
						class="input input-bordered w-full"
						placeholder="https://your.app/public-board/awesome-board"
						bind:value={boardUrl}
						required
					/>
				</div>
				<div>
					<label class="label" for="organization-select">
						<span class="label-text">Destination organization</span>
					</label>
					<select
						id="organization-select"
						name="organizationId"
						class="select select-bordered w-full"
						bind:value={organizationId}
						required
					>
						<option value="" disabled selected>Select organization</option>
						{#each data.organizations as org (org.id)}
							<option value={org.id}>{org.name}</option>
						{/each}
					</select>
				</div>
				<div class="card-actions justify-end">
					<button
						type="submit"
						class="btn btn-primary"
						disabled={!boardUrl.trim() || !organizationId}>Import</button
					>
					<a class="btn btn-ghost" href="/">Cancel</a>
				</div>
			</form>
		</div>
	</div>
</div>
