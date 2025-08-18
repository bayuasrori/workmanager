<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="hero min-h-screen bg-base-100">
	<div class="card bg-base-200 w-96 shadow-sm">
		<div class="card-body">
			<h2 class="card-title">Login/Register</h2>
			<p style="color: red">{form?.message ?? ''}</p>

			<form method="post" action="?/login" use:enhance>
				<label>
					Username
					<input
						name="username"
						class="mt-1 px-3 text-black py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</label>
				<label>
					Password
					<input
						type="password"
						name="password"
						class="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</label>
				<button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
					>Login</button
				>
				<button
					formaction="?/register"
					class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
					>Register</button
				>
			</form>
		</div>
	</div>
</div>
