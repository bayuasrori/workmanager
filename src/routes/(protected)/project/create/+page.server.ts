import { projectService, organizationService } from '$lib/server/service';
import { redirect, fail } from '@sveltejs/kit';
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
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const organizationIdField = data.get('organizationId');
		const organizationId =
			typeof organizationIdField === 'string' && organizationIdField.length > 0
				? organizationIdField
				: null;
		if (organizationId) {
			const userId = locals.user?.id;
			if (!userId) {
				return fail(401, { message: 'Tidak diizinkan membuat proyek.' });
			}
			const allowed = await organizationService.getByMemberUserId(userId);
			const hasAccess = allowed.some((org) => org.id === organizationId);
			if (!hasAccess) {
				return fail(403, {
					message: 'Anda bukan anggota organisasi tersebut.'
				});
			}
		}
		const creatorId = locals.user?.id ?? undefined;
		await projectService.create({
			name,
			description: null,
			slug: null,
			organizationId,
			isPublic: false
		}, creatorId);
		throw redirect(303, '/project');
	}
};
