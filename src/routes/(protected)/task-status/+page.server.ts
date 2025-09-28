import { taskStatusService, projectService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/login');
	}
	const projects = await projectService.getByMemberUserId(userId);
	const projectIds = projects.map((p) => p.id);
	const taskStatuses = await taskStatusService.getByProjectIds(projectIds);
	return { taskStatuses };
};

export const actions: Actions = {
	deleteStatus: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		await taskStatusService.delete(id, { actorId: locals.user?.id });
		throw redirect(303, '/task-status');
	}
};
