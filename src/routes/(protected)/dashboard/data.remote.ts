import * as v from 'valibot';
import { query, getRequestEvent, command } from '$app/server';
import { redirect } from '@sveltejs/kit';
import {
	activityService,
	projectService,
	taskService,
	taskStatusService
} from '$lib/server/service';
import { summarizeRecentActivity } from '$lib/server/service/activitySummary';

type MemberProject = Awaited<ReturnType<typeof projectService.getByMemberUserId>>[number];

export const getDashboardData = query(
	v.object({
		projectId: v.optional(v.string()),
		hasProjectParam: v.optional(v.boolean())
	}),
	async ({ projectId, hasProjectParam }) => {
		const { locals } = getRequestEvent();
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const userId = locals.user.id;
		const requestedProjectId = projectId ?? '';
		const hasProject = hasProjectParam ?? false;

		const [rawProjects, userTasks, recentActivities] = await Promise.all([
			projectService.getByMemberUserId(userId),
			taskService.getUserTasks(userId),
			activityService.getRecentForUser(userId, 5)
		]);

		const projects = rawProjects.filter((project: MemberProject) => !project.isPublic);
		const projectIds = new Set(projects.map((project) => project.id));
		let selectedProjectId = '';
		if (hasProject) {
			selectedProjectId =
				requestedProjectId && projectIds.has(requestedProjectId) ? requestedProjectId : '';
		} else {
			selectedProjectId = projects.at(0)?.id ?? '';
		}

		const tasks_status = await taskStatusService.getTaskCountInStatus(
			selectedProjectId || undefined
		);

		const taskCount = userTasks.length;
		const dailyActivity = await activityService.getDailyActivity(selectedProjectId);

		return {
			userTasks,
			taskCount,
			tasks_status,
			projects,
			selectedProjectId,
			recentActivities,
			dailyActivity
		};
	}
);

export const summarizeActivity = command(v.object({}), async () => {
	const { locals } = getRequestEvent();
	const userId = locals.user?.id;
	if (!userId) {
		redirect(302, '/login');
	}
	const recent = await activityService.getRecentForUser(userId, 20);
	const summary = await summarizeRecentActivity(recent);
	return { summary };
});
