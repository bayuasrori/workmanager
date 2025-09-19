import { organizationMemberService, organizationService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		return { organizations: [] };
	}
	const organizations = await organizationService.getByMemberUserId(userId);
	return { organizations };
};

export const actions: Actions = {
	delete: async ({ url, locals }) => {
		const id = url.searchParams.get('id');
		const userId = locals.user?.id;
		if (!id || !userId) return { success: false };
		const membership = await organizationMemberService.get(id, userId);
		if (!membership) {
			const organization = await organizationService.getById(id);
			if (!organization || organization.ownerId !== userId) {
				return { success: false };
			}
		}
		try {
			await organizationService.delete(id);
			return { success: true };
		} catch {
			return { success: false };
		}
	}
};
