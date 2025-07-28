import { userService } from '../../../lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const user = await userService.getById(params.id);
	return { user };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const age = parseInt(data.get('age') as string);
		const passwordHash = data.get('passwordHash') as string;
		await userService.update(params.id, { username, age, passwordHash });
		throw redirect(303, '/user');
	}
};
