import { projectService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	const projects = user?.id ? await projectService.getByMemberUserId(user.id) : [];
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
