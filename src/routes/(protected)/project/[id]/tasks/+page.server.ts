import { taskService } from '$lib/server/service/task';
import { taskStatusService } from '$lib/server/service/taskStatus';
import { projectService } from '$lib/server/service';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const projectId = params.id;
	const isMember = await projectService.isMember(projectId, userId);
	if (!isMember) {
		throw error(403, 'You are not a member of this project');
	}

	const statusId = url.searchParams.get('status');
	let tasks;
	if (statusId) {
		tasks = await taskService.getByProjectIdAndStatus(projectId, statusId);
	} else {
		tasks = await taskService.getByProjectId(projectId);
	}

	const taskStatuses = await taskStatusService.getByProjectId(projectId);
	const project = await projectService.getById(projectId);

	return { tasks, taskStatuses, project };
};