import { projectService } from '../../lib/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const projects = await projectService.getAll();
	return { projects };
};

export const actions: Actions = {
	delete: async ({ url }) => {
		const id = url.searchParams.get('id');
		if (!id) return { success: false };
		await projectService.delete(id);
		return { success: true };
	}
};
