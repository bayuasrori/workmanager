<script lang="ts">
	import type { PageData } from './$types';
	import Chart from '$lib/components/Chart.svelte';

	export let data: PageData;

	let projects = data?.projects ?? [];
	let tasksStatus = data?.tasks_status ?? [];
	let taskCount = data?.taskCount ?? 0;
	let userTasks = data?.userTasks ?? [];
	let recentActivities = data?.recentActivities ?? [];
	let selectedProjectId = data?.selectedProjectId ?? '';
	let dataSelectedProjectId = selectedProjectId;
	let projectName = selectedProjectId
		? projects.find((project) => project.id === selectedProjectId)?.name ?? 'Proyek terpilih'
		: 'Semua proyek';
	let statusTotalCount = tasksStatus.reduce((sum, status) => sum + Number(status.count ?? 0), 0);
	let tasksLink = selectedProjectId ? `/project/${selectedProjectId}/tasks` : '/tasks';

	$: projects = data?.projects ?? [];
	$: tasksStatus = data?.tasks_status ?? [];
	$: taskCount = data?.taskCount ?? 0;
	$: userTasks = data?.userTasks ?? [];
	$: recentActivities = data?.recentActivities ?? [];
	$: dailyActivity = data?.dailyActivity ?? [];

	let chartData = {
		labels: [] as string[],
		datasets: [
			{
				label: 'Aktivitas Harian',
				data: [] as number[],
				backgroundColor: 'rgba(16, 185, 129, 0.5)',
				borderColor: 'rgba(16, 185, 129, 1)',
				borderWidth: 1
			}
		]
	};

	$: {
		if (dailyActivity) {
			const labels = dailyActivity.map((d) => d.date);
			const counts = dailyActivity.map((d) => d.count);
			chartData = {
				labels: labels,
				datasets: [
					{
						label: 'Aktivitas Harian',
						data: counts,
						backgroundColor: 'rgba(16, 185, 129, 0.5)',
						borderColor: 'rgba(16, 185, 129, 1)',
						borderWidth: 1
					}
				]
			};
		}
	}

	$: {
		const incomingId = data?.selectedProjectId ?? '';
		if (incomingId !== dataSelectedProjectId) {
			dataSelectedProjectId = incomingId;
			selectedProjectId = incomingId;
		}
	}

	$: projectName = selectedProjectId
		? projects.find((project) => project.id === selectedProjectId)?.name ?? 'Proyek terpilih'
		: 'Semua proyek';

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

	const formatter = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	const typeDescriptions: Record<string, string> = {
		TASK_CREATED: 'Tugas baru dibuat',
		TASK_UPDATED: 'Tugas diperbarui',
		TASK_DELETED: 'Tugas dihapus',
		TASK_STATUS_CREATED: 'Status baru ditambahkan',
		TASK_STATUS_UPDATED: 'Status diperbarui',
		TASK_STATUS_DELETED: 'Status dihapus',
		TASK_STATUS_REORDERED: 'Urutan status diperbarui',
		TASK_STATUS_CHANGED: 'Status tugas berubah',
		TASK_COMMENT_ADDED: 'Komentar ditambahkan',
		TASK_COMMENT_DELETED: 'Komentar dihapus'
	};

	const typeIcons: Record<string, string> = {
		TASK_CREATED: '✨',
		TASK_UPDATED: '📝',
		TASK_DELETED: '🗑️',
		TASK_STATUS_CREATED: '🏷️',
		TASK_STATUS_UPDATED: '🏷️',
		TASK_STATUS_DELETED: '🏷️',
		TASK_STATUS_REORDERED: '🔄',
		TASK_STATUS_CHANGED: '🔄',
		TASK_COMMENT_ADDED: '💬',
		TASK_COMMENT_DELETED: '💬'
	};

	const describeActivity = (activity: (typeof recentActivities)[number]) =>
		activity?.description ?? typeDescriptions[activity?.type ?? ''] ?? 'Aktivitas terbaru';

	const formatTimestamp = (value: Date | string) => {
		try {
			const date = value instanceof Date ? value : new Date(value);
			return formatter.format(date);
		} catch {
			return '';
		}
	};
</script>

<div class="container mx-auto p-4">
	<div
		class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lime-100 via-emerald-200/70 to-amber-100 p-6 shadow-xl"
	>
		<div class="flex flex-col gap-4 pb-2 md:flex-row md:items-end md:justify-between">
			<div>
				<h1 class="text-3xl font-extrabold text-emerald-900">Dasbor</h1>
				<p class="mt-1 text-sm text-emerald-900/80">Ringkasan untuk {projectName}</p>
			</div>
			{#if projects.length}
				<form method="GET" class="w-full max-w-xs md:w-auto">
					<label class="form-control w-full">
						<div class="label">
							<span class="label-text text-sm font-medium text-emerald-900">Pilih proyek</span>
						</div>
						<select
							class="select select-bordered bg-emerald-50 border-emerald-300 text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-200"
							name="projectId"
							bind:value={selectedProjectId}
							on:change={submitProjectFilter}
						>
							<option value="">Semua proyek</option>
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
					<h2 class="card-title text-emerald-100">Total Proyek</h2>
					<p class="text-4xl font-extrabold">{projects.length}</p>
					<div class="card-actions justify-end">
						<a
							href="/project"
							class="btn btn-sm bg-amber-400 hover:bg-amber-500 border-none text-emerald-900"
							data-sveltekit-reload
						>
							Lihat Proyek
						</a>
					</div>
				</div>
			</div>
			<div class="card bg-amber-300 text-emerald-900 shadow-lg border border-amber-200">
				<div class="card-body">
					<h2 class="card-title text-emerald-900/80">Tugas untuk Kamu</h2>
					<p class="text-4xl font-extrabold">{taskCount}</p>
					{#if userTasks.length > 0}
						<ul class="text-sm space-y-1 mt-2">
							{#each userTasks.slice(0, 3) as task}
								<li>
									<a href="/project/{task.projectId}/tasks/{task.id}" class="hover:underline">
										{task.name}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
					<div class="card-actions justify-end">
						<a
							href="/tasks"
							class="btn btn-sm bg-emerald-700 hover:bg-emerald-800 border-none text-emerald-50"
							data-sveltekit-reload
						>
							Lihat Semua Tugas
						</a>
					</div>
				</div>
			</div>
			<div class="card bg-emerald-50 text-emerald-900 shadow-lg border border-emerald-200">
				<div class="card-body">
					<h2 class="card-title text-emerald-900/80">Tugas Terpantau</h2>
					<p class="text-4xl font-extrabold">{statusTotalCount}</p>
					<p class="text-xs text-emerald-900/70">Di semua kolom untuk {projectName}</p>
				</div>
			</div>
			<div class="card bg-amber-100 text-emerald-900 shadow-lg border border-amber-200">
				<div class="card-body">
					<h2 class="card-title text-emerald-900/80">Ringkasan Fokus</h2>
					<p class="text-base text-emerald-900/80">
						Periksa tugas yang mendekati tenggat atau yang sudah lama tidak diperbarui. Jaga momentum tim tetap tinggi.
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
							<span class="badge bg-emerald-100 text-emerald-800 border-emerald-200"
								>Status</span
							>
						</div>
						<p class="text-4xl font-extrabold text-emerald-700">{Number(status.count ?? 0)}</p>
						<div class="card-actions justify-end">
							<a
								href={tasksLink}
								class="btn btn-sm bg-amber-400 text-emerald-900 border-none hover:bg-amber-500"
								data-sveltekit-reload
							>
								Lihat Tugas
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="alert bg-emerald-50 text-emerald-900 border border-emerald-200 mt-6">
			<span>Belum ada data status tugas untuk pilihan ini.</span>
		</div>
	{/if}

	<div class="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
		<div class="card bg-white shadow-lg border border-emerald-200">
			<div class="card-body">
				<h2 class="card-title text-emerald-900">Aktivitas Terbaru</h2>
				{#if recentActivities.length}
					<ul class="space-y-3 text-sm text-emerald-800">
						{#each recentActivities as activity (activity.id)}
							<li class="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-3">
								<div class="flex items-center justify-between gap-3">
									<p class="font-semibold text-emerald-900">
										<span class="mr-2">{typeIcons[activity.type] ?? '🔔'}</span>
										{describeActivity(activity)}
									</p>
									<span class="text-xs text-emerald-700/70"
										>{formatTimestamp(activity.createdAt)}</span
									>
								</div>
								<p class="mt-1 text-xs text-emerald-700/80">{activity.projectName}</p>
							</li>
						{/each}
					</ul>
				{:else}
					<p
						class="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-sm text-emerald-700/70"
					>
						Belum ada aktivitas terbaru di proyek kamu.
					</p>
				{/if}
			</div>
		</div>

		<div
			class="card bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-emerald-50 shadow-lg"
		>
			<div class="card-body">
				<h2 class="card-title">Aktivitas Proyek Harian</h2>
				{#if dailyActivity.length}
					<Chart type="bar" data={chartData} options={{ responsive: true }} />
				{:else}
					<p class="mt-2 text-center text-sm text-emerald-50/90">
						Tidak ada aktivitas untuk ditampilkan.
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
