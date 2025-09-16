import { userService } from '$lib/server/service';
import { hash } from '@node-rs/argon2';
import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const age = parseInt(data.get('age') as string);
		const password = data.get('password') as string;
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		await userService.create({ username, age, passwordHash });
		throw redirect(303, '/user');
	}
};
