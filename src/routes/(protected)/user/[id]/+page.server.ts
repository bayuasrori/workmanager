import { userService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect, fail, error } from '@sveltejs/kit';
import { verify, hash } from '@node-rs/argon2';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/login');
	}
	if (params.id !== userId && !locals.user?.isAdmin) {
		throw error(403, 'Forbidden');
	}
	const user = await userService.getById(params.id);
	return { user };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const userId = locals.user?.id;
		if (!userId) {
			throw error(401, 'Unauthorized');
		}
		if (params.id !== userId && !locals.user?.isAdmin) {
			throw error(403, 'Forbidden');
		}

		const data = await request.formData();
		const usernameEntry = data.get('username');
		const username = typeof usernameEntry === 'string' ? usernameEntry.trim() : '';
		const ageEntry = data.get('age');
		const ageString = typeof ageEntry === 'string' ? ageEntry : '';
		let age: number | undefined = parseInt(ageString);
		if (isNaN(age)) {
			age = undefined;
		}
		const emailRaw = data.get('email');
		const emailInput = typeof emailRaw === 'string' ? emailRaw.trim() : '';
		const email = emailInput.toLowerCase();
		const values = { username, email: emailInput, age: ageString };
		if (!email) {
			return fail(400, { message: 'Email diperlukan.', values });
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { message: 'Format email tidak valid.', values });
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
				return fail(400, { message: 'Old password is required to change password.', values });
			}

			const validOldPassword = await verify(passwordHash, oldPassword);
			if (!validOldPassword) {
				return fail(400, { message: 'Old password does not match.', values });
			}

			passwordHash = await hash(newPassword);
		}

		const normalizedAge = typeof age === 'number' ? age : null;
		try {
			await userService.update(params.id, { username, age: normalizedAge, email, passwordHash });
		} catch (error) {
			return fail(400, {
				message: 'Gagal memperbarui pengguna. Pastikan nama pengguna dan email belum digunakan.',
				values
			});
		}
		throw redirect(303, '/user');
	}
};
