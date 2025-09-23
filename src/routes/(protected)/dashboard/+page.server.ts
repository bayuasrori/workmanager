import { activityService, projectService, taskService, taskStatusService } from '$lib/server/service';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type MemberProject = Awaited<ReturnType<typeof projectService.getByMemberUserId>>[number];

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	const user_id = locals.user?.id;
	const requestedProjectId = url.searchParams.get('projectId') ?? '';
	const hasProjectParam = url.searchParams.has('projectId');

	const [rawProjects, userTasks, recentActivities] = await Promise.all([
		projectService.getByMemberUserId(user_id),
		taskService.getUserTasks(user_id),
		activityService.getRecentForUser(user_id, 5)
	]);

	const projects = rawProjects.filter((project: MemberProject) => !project.isPublic);
	const projectIds = new Set(projects.map((project) => project.id));
	let selectedProjectId = '';
	if (hasProjectParam) {
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

	return { userTasks, taskCount, tasks_status, projects, selectedProjectId, recentActivities, dailyActivity };
};
