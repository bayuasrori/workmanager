<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let projects = data?.projects ?? [];
	let tasksStatus = data?.tasks_status ?? [];
	let taskCount = data?.taskCount ?? 0;
	let selectedProjectId = data?.selectedProjectId ?? '';
	let dataSelectedProjectId = selectedProjectId;
	let projectName = selectedProjectId
		? (projects.find((project) => project.id === selectedProjectId)?.name ?? 'Selected project')
		: 'All projects';
	let statusTotalCount = tasksStatus.reduce((sum, status) => sum + Number(status.count ?? 0), 0);
	let tasksLink = selectedProjectId ? `/project/${selectedProjectId}/tasks` : '/tasks';

	$: projects = data?.projects ?? [];
	$: tasksStatus = data?.tasks_status ?? [];
	$: taskCount = data?.taskCount ?? 0;

	$: {
		const incomingId = data?.selectedProjectId ?? '';
		if (incomingId !== dataSelectedProjectId) {
			dataSelectedProjectId = incomingId;
			selectedProjectId = incomingId;
		}
	}

	$: projectName = selectedProjectId
		? (projects.find((project) => project.id === selectedProjectId)?.name ?? 'Selected project')
		: 'All projects';

	$: statusTotalCount = tasksStatus.reduce((sum, status) => sum + Number(status.count ?? 0), 0);

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
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lime-100 via-emerald-200/70 to-amber-100 p-6 shadow-xl">
        <div class="flex flex-col gap-4 pb-2 md:flex-row md:items-end md:justify-between">
            <div>
                <h1 class="text-3xl font-extrabold text-emerald-900">Dashboard</h1>
                <p class="mt-1 text-sm text-emerald-900/80">Overview for {projectName}</p>
            </div>
        {#if projects.length}
            <form method="GET" class="w-full max-w-xs md:w-auto">
                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text text-sm font-medium text-emerald-900">Select project</span>
                        </div>
                        <select
                            class="select select-bordered bg-emerald-50 border-emerald-300 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-200"
                            name="projectId"
                            bind:value={selectedProjectId}
                            on:change={submitProjectFilter}
                        >
                        <option value="">All projects</option>
                        {#each projects as project (project.id)}
                            <option value={project.id}>{project.name}</option>
                        {/each}
                        </select>
                    </label>
                </form>
            {/if}
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="card bg-emerald-800 text-emerald-50 shadow-lg border border-emerald-700">
            <div class="card-body">
                <h2 class="card-title text-emerald-100">Total Projects</h2>
                <p class="text-4xl font-extrabold">{projects.length}</p>
                <div class="card-actions justify-end">
                    <a
                        href="/project"
                        class="btn btn-sm bg-amber-400 hover:bg-amber-500 border-none text-emerald-900"
                        data-sveltekit-reload
                    >
                        View Projects
                    </a>
                </div>
            </div>
        </div>
        <div class="card bg-amber-300 text-emerald-900 shadow-lg border border-amber-200">
            <div class="card-body">
                <h2 class="card-title text-emerald-900/80">Tasks Assigned to You</h2>
                <p class="text-4xl font-extrabold">{taskCount}</p>
                <div class="card-actions justify-end">
                    <a
                        href="/tasks"
                        class="btn btn-sm bg-emerald-700 hover:bg-emerald-800 border-none text-emerald-50"
                        data-sveltekit-reload
                    >
                        View My Tasks
                    </a>
                </div>
            </div>
        </div>
        <div class="card bg-emerald-50 text-emerald-900 shadow-lg border border-emerald-200">
            <div class="card-body">
                <h2 class="card-title text-emerald-900/80">Tracked Tasks</h2>
                <p class="text-4xl font-extrabold">{statusTotalCount}</p>
                <p class="text-xs text-emerald-900/70">Across columns for {projectName}</p>
            </div>
        </div>
        <div class="card bg-amber-100 text-emerald-900 shadow-lg border border-amber-200">
            <div class="card-body">
                <h2 class="card-title text-emerald-900/80">Focus Summary</h2>
                <p class="text-base text-emerald-900/80">
                    Keep momentum by reviewing tasks in the boards below and closing out blocked items.
                </p>
            </div>
        </div>
        </div>
    </div>

    {#if tasksStatus.length}
        <div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {#each tasksStatus as status (status.statusId)}
                <div class="card border border-emerald-200 bg-white shadow-lg">
                    <div class="card-body">
                        <div class="flex items-center justify-between gap-2">
                            <h2 class="card-title text-emerald-900">{status.task_status}</h2>
                            <span class="badge bg-emerald-100 text-emerald-800 border-emerald-200">Status</span>
                        </div>
                        <p class="text-4xl font-extrabold text-emerald-700">{Number(status.count ?? 0)}</p>
                        <div class="card-actions justify-end">
                            <a
                                href={tasksLink}
                                class="btn btn-sm bg-amber-400 text-emerald-900 border-none hover:bg-amber-500"
                                data-sveltekit-reload
                            >
                                View Tasks
                            </a>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="alert bg-emerald-50 text-emerald-900 border border-emerald-200 mt-6">
            <span>No task status data available yet for this selection.</span>
        </div>
    {/if}

    <div class="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="card bg-white shadow-lg border border-emerald-200">
            <div class="card-body">
                <h2 class="card-title text-emerald-900">Recent Activity</h2>
                <ul class="space-y-2 text-sm text-emerald-800">
                    <li>✨ A new task "Design new logo" was added.</li>
                    <li>✅ "Develop homepage" moved to Done.</li>
                    <li>🚀 Project "Mobile App Redesign" launched.</li>
                    <li>🤝 Jane Smith joined "Website SEO".</li>
                </ul>
            </div>
        </div>

        <div class="card bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-emerald-50 shadow-lg">
            <div class="card-body">
                <h2 class="card-title">Task Completion Rate</h2>
                <div class="h-4 w-full rounded-full bg-emerald-900/40">
                    <div class="h-4 rounded-full bg-amber-300" style="width: 75%"></div>
                </div>
                <p class="mt-2 text-center text-sm text-emerald-50/90">75% of tasks completed</p>
            </div>
        </div>
    </div>
</div>
