<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedProjectId = data.selectedProjectId ?? '';
	let dataSelectedProjectId = selectedProjectId;
	let projectName = selectedProjectId
		? (data.projects.find((project) => project.id === selectedProjectId)?.name ??
			'Selected project')
		: 'All projects';
	let statusTotalCount = data.tasks_status.reduce(
		(sum, status) => sum + Number(status.count ?? 0),
		0
	);
	let tasksLink = selectedProjectId ? `/project/${selectedProjectId}/tasks` : '/tasks';

	$: {
		const incomingId = data.selectedProjectId ?? '';
		if (incomingId !== dataSelectedProjectId) {
			dataSelectedProjectId = incomingId;
			selectedProjectId = incomingId;
		}
	}

	$: projectName = selectedProjectId
		? (data.projects.find((project) => project.id === selectedProjectId)?.name ??
			'Selected project')
		: 'All projects';

	$: statusTotalCount = data.tasks_status.reduce(
		(sum, status) => sum + Number(status.count ?? 0),
		0
	);

	$: tasksLink = selectedProjectId ? `/project/${selectedProjectId}/tasks` : '/tasks';

	const submitProjectFilter = (event: Event) => {
		const target = event.currentTarget as HTMLSelectElement | null;
		const form = target?.form;
		if (!form) return;
		if (typeof form.requestSubmit === 'function') {
			form.requestSubmit();
		} else {
			form.submit();
		}
	};
</script>

<div class="container mx-auto p-4">
	<div class="flex flex-col gap-4 pb-4 md:flex-row md:items-end md:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-base-content">Dashboard</h1>
			<p class="mt-1 text-sm text-base-content/70">Overview for {projectName}</p>
		</div>
		{#if data.projects.length}
			<form method="GET" class="w-full max-w-xs md:w-auto">
				<label class="form-control w-full">
					<div class="label">
						<span class="label-text text-sm font-medium">Select project</span>
					</div>
					<select
						class="select select-bordered"
						name="projectId"
						bind:value={selectedProjectId}
						on:change={submitProjectFilter}
					>
						<option value="">All projects</option>
						{#each data.projects as project (project.id)}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</label>
			</form>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-4 pb-6 md:grid-cols-2 xl:grid-cols-4">
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title text-base-content/80">Total Projects</h2>
				<p class="text-4xl font-bold text-base-content">{data.projects.length}</p>
				<div class="card-actions justify-end">
					<a href="/project" class="btn btn-primary btn-sm">View Projects</a>
				</div>
			</div>
		</div>
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title text-base-content/80">Tasks Assigned to You</h2>
				<p class="text-4xl font-bold text-base-content">{data.taskCount}</p>
				<div class="card-actions justify-end">
					<a href="/tasks" class="btn btn-ghost btn-sm">View My Tasks</a>
				</div>
			</div>
		</div>
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title text-base-content/80">Tracked Tasks</h2>
				<p class="text-4xl font-bold text-base-content">{statusTotalCount}</p>
				<p class="text-xs text-base-content/60">Across columns for {projectName}</p>
			</div>
		</div>
	</div>

	{#if data.tasks_status.length}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each data.tasks_status as status (status.statusId)}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<h2 class="card-title text-base-content/80">{status.task_status}</h2>
						<p class="text-4xl font-bold text-base-content">{Number(status.count ?? 0)}</p>
						<div class="card-actions justify-end">
							<a href={tasksLink} class="btn btn-ghost btn-sm">View Tasks</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="alert bg-base-100/70 text-base-content/80">
			<span>No task status data available yet for this selection.</span>
		</div>
	{/if}

	<div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title">Recent Activity</h2>
				<ul class="space-y-2 text-sm text-base-content/80">
					<li>User John Doe created a new task: "Design new logo".</li>
					<li>Task "Develop homepage" was marked as complete.</li>
					<li>A new project "Mobile App Redesign" was created.</li>
					<li>User Jane Smith was added to project "Website SEO".</li>
				</ul>
			</div>
		</div>

		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title">Task Completion Rate</h2>
				<div class="h-4 w-full rounded-full bg-base-300">
					<div class="h-4 rounded-full bg-primary" style="width: 75%"></div>
				</div>
				<p class="mt-2 text-center text-sm text-base-content/70">75% of tasks completed</p>
			</div>
		</div>
	</div>
</div>
