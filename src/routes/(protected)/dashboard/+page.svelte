<script lang="ts">
	import { page } from '$app/stores';
	const {data} = $props();
	console.log(data.tasks_status);
	
</script>

<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold mb-4">Dashboard</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Total Projects</h2>
				<p class="text-4xl font-bold">12</p>
				<div class="card-actions justify-end">
					<button class="btn btn-primary">View Projects</button>
				</div>
			</div>
		</div>

		{#each data.tasks_status as status (status.statusId)}

		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Tasks in {status.task_status}</h2>
				<p class="text-4xl font-bold">{status.count}</p>
                <div class="card-actions justify-end">
					<a href="/" class="btn btn-primary">View Tasks</a>
				</div>
			</div>
		</div>
		{/each}
		
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Recent Activity</h2>
				<ul class="list-disc list-inside">
					<li>User John Doe created a new task: "Design new logo".</li>
					<li>Task "Develop homepage" was marked as complete.</li>
					<li>A new project "Mobile App Redesign" was created.</li>
					<li>User Jane Smith was added to project "Website SEO".</li>
				</ul>
			</div>
		</div>

		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Task Completion Rate</h2>
				<div class="w-full bg-gray-200 rounded-full h-4">
					<div class="bg-primary h-4 rounded-full" style="width: 75%"></div>
				</div>
				<p class="text-center mt-2">75% of tasks completed</p>
			</div>
		</div>
	</div>
</div>