import { projectService, organizationService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	const projects = user?.id ? await projectService.getByMemberUserId(user.id) : [];
	return { projects };
};

export const actions: Actions = {
	delete: async ({ url, locals }) => {
		const id = url.searchParams.get('id');
		if (!id) return { success: false };

		const userId = locals.user?.id;
		if (!userId) return { success: false };

		const project = await projectService.getById(id);
		if (!project) return { success: false };

		if (project.organizationId) {
			const organization = await organizationService.getById(project.organizationId);
			if (!organization) return { success: false };

			if (organization.ownerId !== userId) {
				const isMember = await organizationService.isMember(project.organizationId, userId);
				if (!isMember) return { success: false };
			}
		}

		await projectService.delete(id);
		return { success: true };
	}
};
