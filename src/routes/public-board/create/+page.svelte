<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData | null; data: any } = $props();
</script>

<div class="min-h-screen bg-base-100 py-8">
	<div class="container mx-auto px-4 max-w-2xl">
		<div class="card bg-base-200 shadow-lg">
			<div class="card-body">
				<h1 class="card-title text-3xl mb-6">Create Public Board</h1>
				<p class="text-base-content/70 mb-6">
					Create a public board that anyone can view and contribute to. Perfect for open source projects, community initiatives, or public task tracking.
				</p>

				{#if form && typeof form === 'object' && 'message' in form}
					<div class="alert alert-error mb-6">
						<span>{form.message}</span>
					</div>
				{/if}

				<form method="post" action="?/create" use:enhance>
					<div class="form-control mb-4">
						<label class="label" for="name">
							<span class="label-text font-semibold">Board Name *</span>
						</label>
						<input
							id="name"
							name="name"
							type="text"
							placeholder="Enter board name"
							class="input input-bordered w-full"
							required
							maxlength="100"
						/>
						<div class="label">
							<span class="label-text-alt">This will be used to generate a unique URL for your board</span>
						</div>
					</div>

					<div class="form-control mb-6">
						<label class="label" for="description">
							<span class="label-text font-semibold">Description</span>
						</label>
						<textarea
							id="description"
							name="description"
							placeholder="Describe what this board is for (optional)"
							class="textarea textarea-bordered w-full h-24"
							maxlength="500"
						></textarea>
						<div class="label">
							<span class="label-text-alt">Optional description to help others understand your board</span>
						</div>
					</div>

					<div class="card bg-base-100 p-4 mb-6">
						<h3 class="font-semibold mb-2">✨ What you get:</h3>
						<ul class="text-sm text-base-content/70 space-y-1">
							<li>• Public URL that anyone can access</li>
							<li>• Kanban-style task board</li>
							<li>• Free forever - no signup required</li>
							<li>• Perfect for open source projects</li>
						</ul>
					</div>

					<div class="flex gap-4">
						<button type="submit" class="btn btn-primary flex-1">
							Create Public Board
						</button>
						<a href="/" class="btn btn-outline">Cancel</a>
					</div>
				</form>

				{#if data.isAuthenticated}
					<div class="divider">OR</div>
					<div class="text-center">
						<p class="text-sm text-base-content/70 mb-2">Want full team management features?</p>
						<a href="/dashboard" class="btn btn-secondary btn-sm">Go to Dashboard</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
