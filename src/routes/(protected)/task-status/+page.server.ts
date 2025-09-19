import { taskStatusService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const taskStatuses = await taskStatusService.getAll();
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
