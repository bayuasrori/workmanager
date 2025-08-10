import { organizationService, userService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const users = await userService.getAll();
	return { users };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const ownerId = data.get('ownerId') as string;
		await organizationService.create({ name, ownerId });
		throw redirect(303, '/org');
	}
};
