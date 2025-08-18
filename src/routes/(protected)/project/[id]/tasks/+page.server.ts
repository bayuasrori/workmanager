import { taskService } from '$lib/server/service/task';
import { taskStatusService } from '$lib/server/service/taskStatus';
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
	const taskStatuses = await taskStatusService.getAll();
	return { tasks, taskStatuses };
};

export const actions: Actions = {
	updateTaskStatus: async ({ request }) => {
		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		const newStatusId = data.get('newStatusId') as string;
		await taskService.update(taskId, { statusId: newStatusId });
		return { success: true };
	}
};
