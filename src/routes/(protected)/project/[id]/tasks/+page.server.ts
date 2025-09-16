import { taskService } from '$lib/server/service/task';
import { taskStatusService } from '$lib/server/service/taskStatus';
import { projectService } from '$lib/server/service/project';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const projectId = params.id;
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

export const actions: Actions = {
	updateTaskStatus: async ({ request }) => {
		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		const newStatusId = data.get('newStatusId') as string;
		await taskService.update(taskId, { statusId: newStatusId });
		return { success: true };
	},
	createStatus: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		
		if (!name || name.trim().length === 0) {
			return { success: false, error: 'Status name is required' };
		}
		
		await taskStatusService.createForProject(params.id, name.trim());
		return { success: true };
	},
	deleteProject: async ({ params }) => {
		await projectService.deleteCascade(params.id);
		throw redirect(303, '/project');
	}
};
