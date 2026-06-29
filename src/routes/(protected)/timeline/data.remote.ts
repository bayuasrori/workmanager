import * as v from 'valibot';
import { query, getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { projectService, taskService } from '$lib/server/service';

export const getTimelineData = query(
	v.object({ projectId: v.optional(v.string()) }),
	async ({ projectId }) => {
		const { locals } = getRequestEvent();
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const userId = locals.user.id;
		const memberProjects = (await projectService.getByMemberUserId(userId)).filter(
			(p) => !p.isPublic
		);
		const memberProjectIds = new Set(memberProjects.map((p) => p.id));

		const isValidSelection = !!projectId && memberProjectIds.has(projectId);
		const targetProjects = isValidSelection
			? memberProjects.filter((p) => p.id === projectId)
			: memberProjects;

		type TimelineEvent = {
			id: string;
			title: string;
			start: string;
			end: string | null;
			projectId: string;
			projectName: string;
			statusName: string | null;
		};

		const events: TimelineEvent[] = [];
		for (const project of targetProjects) {
			const tasks = await taskService.getByProjectId(project.id);
			for (const t of tasks) {
				if (!t.startDate) continue;
				events.push({
					id: t.id,
					title: t.name,
					start: t.startDate.toISOString(),
					end: t.endDate ? t.endDate.toISOString() : null,
					projectId: project.id,
					projectName: project.name,
					statusName: t.status?.name ?? null
				});
			}
		}

		return {
			events,
			projects: memberProjects.map((p) => ({ id: p.id, name: p.name })),
			selectedProjectId: isValidSelection ? (projectId as string) : ''
		};
	}
);
