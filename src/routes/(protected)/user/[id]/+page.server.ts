import { userService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { verify, hash } from '@node-rs/argon2';

export const load: PageServerLoad = async ({ params }) => {
	const user = await userService.getById(params.id);
	return { user };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		let age: number | undefined = parseInt(data.get('age') as string);
		if (isNaN(age)) {
			age = undefined;
		}
		const oldPassword = data.get('oldPassword') as string;
		const newPassword = data.get('newPassword') as string;

		const user = await userService.getById(params.id);

		if (!user) {
			return fail(404, { message: 'User not found.' });
		}

		let passwordHash = user.passwordHash;

		if (newPassword) {
			if (!oldPassword) {
				return fail(400, { message: 'Old password is required to change password.' });
			}

			const validOldPassword = await verify(passwordHash, oldPassword);
			if (!validOldPassword) {
				return fail(400, { message: 'Old password does not match.' });
			}

			passwordHash = await hash(newPassword);
		}

		await userService.update(params.id, { username, age, passwordHash });
		throw redirect(303, '/user');
	}
};
