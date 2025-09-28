import { taskStatusService, projectService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/login');
	}
	const taskStatus = await taskStatusService.getById(params.id);
	if (!taskStatus) {
		throw error(404, 'Not Found');
	}
	if (taskStatus.projectId) {
		const isMember = await projectService.isMember(taskStatus.projectId, userId);
		if (!isMember) {
			throw error(403, 'Forbidden');
		}
	}
	return { taskStatus };
};

export const actions: Actions = {
	updateStatus: async ({ request, params, locals }) => {
		const userId = locals.user?.id;
		if (!userId) {
			throw error(401, 'Unauthorized');
		}
		const taskStatus = await taskStatusService.getById(params.id);
		if (!taskStatus) {
			throw error(404, 'Not Found');
		}
		if (taskStatus.projectId) {
			const isMember = await projectService.isMember(taskStatus.projectId, userId);
			if (!isMember) {
				throw error(403, 'Forbidden');
			}
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		await taskStatusService.update(params.id, { name }, { actorId: locals.user?.id });
		throw redirect(303, '/task-status');
	}
};
