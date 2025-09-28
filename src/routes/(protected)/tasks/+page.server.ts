import { taskService } from '$lib/server/service';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	const tasks = await taskService.getUserTasks(locals.user.id);
	return { tasks };
};

export const actions: Actions = {
	delete: async ({ url, locals }) => {
		const id = url.searchParams.get('id');
		if (!id) return { success: false };
		await taskService.delete(id, { actorId: locals.user?.id });
		return { success: true };
	}
};
