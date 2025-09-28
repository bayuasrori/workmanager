import { userService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (!locals.user.isAdmin) {
		throw error(403, 'Forbidden');
	}
	const users = await userService.getAll();
	return { users };
};

export const actions: Actions = {
	delete: async ({ url, locals }) => {
		if (!locals.user?.isAdmin) {
			throw error(403, 'Forbidden');
		}
		const id = url.searchParams.get('id');
		if (!id) return { success: false };
		await userService.delete(id);
		return { success: true };
	}
};
