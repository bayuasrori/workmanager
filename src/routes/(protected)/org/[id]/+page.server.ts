import { organizationService, userService, organizationMemberService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/login');
	}
	const organization = await organizationService.getById(params.id);
	if (!organization) {
		throw error(404, 'Organization not found');
	}
	const isMember = await organizationMemberService.isMember(params.id, userId);
	if (!isMember && organization.ownerId !== userId) {
		throw error(403, 'You are not a member of this organization');
	}

	const users = await userService.getUsersNotInOrganization(params.id);
	const members = await organizationMemberService.getByOrganizationId(params.id);
	return { organization, users, members };
};

export const actions: Actions = {
	updateOrganization: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const ownerId = data.get('ownerId') as string;
		await organizationService.update(params.id, { name, ownerId });
		throw redirect(303, '/org');
	},
	addMember: async ({ request, params }) => {
		const data = await request.formData();
		const userId = data.get('userId') as string;
		const organizationId = params.id;
		await organizationMemberService.create({ organizationId, userId });
		return { success: true };
	},
	removeMember: async ({ url, params }) => {
		const userId = url.searchParams.get('userId');
		const organizationId = params.id;
		if (!userId) return { success: false };
		await organizationMemberService.delete(organizationId, userId);
		return { success: true };
	}
};
