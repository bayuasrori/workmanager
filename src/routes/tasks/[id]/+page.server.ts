import { taskService, projectService, userService, taskStatusService } from '../../../lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const task = await taskService.getById(params.id);
	const projects = await projectService.getAll();
	const users = await userService.getAll();
	const taskStatuses = await taskStatusService.getAll();
	return { task, projects, users, taskStatuses };
};

export const actions: Actions = {
	updateTask: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const projectId = data.get('projectId') as string;
		const assigneeId = data.get('assigneeId') as string;
		const statusId = data.get('statusId') as string;
		await taskService.update(params.id, { name, projectId, assigneeId, statusId });
		throw redirect(303, '/tasks');
	}
};
