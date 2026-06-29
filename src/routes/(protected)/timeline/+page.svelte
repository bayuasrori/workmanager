<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Calendar, EventInput } from '@fullcalendar/core';
	import { getTimelineData } from './data.remote';

	let calendarEl: HTMLDivElement;
	let calendar = $state<Calendar | null>(null);
	let selectedProjectId = $state('');

	const timelineQuery = $derived(
		getTimelineData({ projectId: selectedProjectId || undefined })
	);
	const timelineData = $derived(await timelineQuery);
	const loading = $derived(timelineQuery.loading);

	const STATUS_COLORS: { match: string[]; color: string; label: string }[] = [
		{ match: ['done', 'selesai'], color: '#16a34a', label: 'Done' },
		{ match: ['progress', 'jalan'], color: '#2563eb', label: 'In Progress' },
		{ match: ['todo', 'akan', 'backlog', 'to do'], color: '#ca8a04', label: 'To Do' }
	];

	function colorFor(statusName: string | null): string {
		const n = (statusName ?? '').toLowerCase();
		for (const s of STATUS_COLORS) {
			if (s.match.some((m) => n.includes(m))) return s.color;
		}
		return '#6b7280';
	}

	function toFcEvents(): EventInput[] {
		return (timelineData?.events ?? []).map((e) => {
			const c = colorFor(e.statusName);
			return {
				id: e.id,
				title: e.title,
				start: e.start,
				end: e.end ?? undefined,
				backgroundColor: c,
				borderColor: c,
				extendedProps: { projectId: e.projectId, projectName: e.projectName, statusName: e.statusName }
			};
		});
	}

	onMount(() => {
		let cal: Calendar | null = null;
		let disposed = false;

		(async () => {
			const { Calendar } = await import('@fullcalendar/core');
			const dayGridPlugin = (await import('@fullcalendar/daygrid')).default;
			const timeGridPlugin = (await import('@fullcalendar/timegrid')).default;
			const listPlugin = (await import('@fullcalendar/list')).default;
			const idLocale = (await import('@fullcalendar/core/locales/id')).default;

			if (disposed) return;

			cal = new Calendar(calendarEl, {
				plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
				initialView: 'dayGridMonth',
				headerToolbar: {
					left: 'prev,next today',
					center: 'title',
					right: 'dayGridMonth,timeGridWeek,listWeek'
				},
				height: '72vh',
				locale: idLocale,
				eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
				nowIndicator: true,
				navLinks: true,
				dayMaxEvents: 3,
				eventClick: (info) => {
					const pid = info.event.extendedProps.projectId as string | undefined;
					if (pid) goto(`/project/${pid}/tasks`);
				}
			});
			calendar = cal;
			cal.render();
		})();

		return () => {
			disposed = true;
			cal?.destroy();
			calendar = null;
		};
	});

	$effect(() => {
		const cal = calendar;
		if (!cal || !timelineData) return;
		cal.removeAllEvents();
		cal.addEventSource(toFcEvents());
	});

	function onSelectChange(event: Event) {
		selectedProjectId = (event.currentTarget as HTMLSelectElement).value;
	}

	const eventCount = $derived(timelineData?.events.length ?? 0);
</script>

<svelte:head>
	<title>Papanin — Timeline Tugas</title>
</svelte:head>

<div class="space-y-4">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-base-content">Timeline Tugas</h1>
			<p class="text-sm text-base-content/70">
				Pantau jadwal tugas berdasarkan tanggal — keseluruhan atau per proyek.
			</p>
		</div>
		<label class="form-control w-full sm:w-64">
			<span class="label-text font-semibold mb-1">Filter Proyek</span>
			<select
				class="select select-bordered select-sm"
				value={selectedProjectId}
				onchange={onSelectChange}
			>
				<option value="">Semua Proyek</option>
				{#each timelineData?.projects ?? [] as p (p.id)}
					<option value={p.id}>{p.name}</option>
				{/each}
			</select>
		</label>
	</header>

	<div class="flex flex-wrap items-center gap-4 text-xs text-base-content/70">
		<span class="font-semibold uppercase tracking-wide">Status:</span>
		{#each STATUS_COLORS as s (s.label)}
			<span class="inline-flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-sm" style="background-color:{s.color}"></span>
				{s.label}
			</span>
		{/each}
		<span class="inline-flex items-center gap-1.5">
			<span class="inline-block h-3 w-3 rounded-sm bg-gray-500"></span>
			Lainnya
		</span>
		<span class="ml-auto rounded-full bg-base-200 px-3 py-1 font-medium">{eventCount} tugas</span>
	</div>

	<div class="relative">
		{#if loading}
			<div
				class="absolute inset-0 z-10 flex items-center justify-center rounded-box bg-base-100/60 backdrop-blur-sm"
			>
				<span class="loading loading-spinner loading-lg text-primary"></span>
			</div>
		{/if}
		<div
			class="rounded-box border border-base-300 bg-base-100 p-2 shadow-sm"
		>
			<div bind:this={calendarEl}></div>
		</div>
	</div>

	{#if eventCount === 0 && !loading}
		<div class="rounded-box border border-dashed border-base-300 p-8 text-center text-base-content/60">
			Belum ada tugas dengan tanggal mulai pada filter ini. Atur
			<span class="font-medium">tanggal mulai</span> di tugas agar muncul di timeline.
		</div>
	{/if}
</div>
