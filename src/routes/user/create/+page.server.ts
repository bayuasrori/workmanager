import { userService } from '../../../lib/server/service';
import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const age = parseInt(data.get('age') as string);
		const passwordHash = data.get('passwordHash') as string;
		await userService.create({ username, age, passwordHash });
		throw redirect(303, '/user');
	}
};
