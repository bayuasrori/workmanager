import { taskService, projectService, userService, taskStatusService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const projects = await projectService.getAll();
	const users = await userService.getAll();
	const taskStatuses = await taskStatusService.getAll();
	return { projects, users, taskStatuses };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const projectId = data.get('projectId') as string;
		const assigneeId = data.get('assigneeId') as string;
		const statusId = data.get('statusId') as string;
		await taskService.create({ name, projectId, assigneeId, statusId });
		throw redirect(303, '/tasks');
	}
};
