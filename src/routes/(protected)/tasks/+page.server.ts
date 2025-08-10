import { taskService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const tasks = await taskService.getAll();
	return { tasks };
};

export const actions: Actions = {
	delete: async ({ url }) => {
		const id = url.searchParams.get('id');
		if (!id) return { success: false };
		await taskService.delete(id);
		return { success: true };
	}
};
