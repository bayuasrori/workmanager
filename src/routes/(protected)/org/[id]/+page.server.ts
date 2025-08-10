import { organizationService, userService, organizationMemberService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const organization = await organizationService.getById(params.id);
	const users = await userService.getAll();
	const members = await organizationMemberService.getAll(); // This will get all members, need to filter by organizationId in svelte
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
