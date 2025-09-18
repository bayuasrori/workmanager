import { projectService, taskService, taskStatusService } from '$lib/server/service';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type MemberProject = Awaited<ReturnType<typeof projectService.getByMemberUserId>>[number];

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	const user_id = locals.user?.id;
	const requestedProjectId = url.searchParams.get('projectId') ?? '';

	const [rawProjects, userTaskCountResult] = await Promise.all([
		projectService.getByMemberUserId(user_id),
		taskService.getUserTaskCount(user_id)
	]);

	const projects = rawProjects.filter((project: MemberProject) => !project.isPublic);
	const projectIds = new Set(projects.map((project) => project.id));
	const selectedProjectId =
		requestedProjectId && projectIds.has(requestedProjectId) ? requestedProjectId : '';

	const tasks_status = await taskStatusService.getTaskCountInStatus(selectedProjectId || undefined);

	const taskCount = userTaskCountResult?.[0]?.count ?? 0;

	return { taskCount, tasks_status, projects, selectedProjectId };
};
