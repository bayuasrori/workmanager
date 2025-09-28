import { userService } from '$lib/server/service';
import { hash } from '@node-rs/argon2';
import type { Actions, PageServerLoad } from './$types';
import { redirect, fail, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (!locals.user.isAdmin) {
		throw error(403, 'Forbidden');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) {
			throw error(403, 'Forbidden');
		}
		const data = await request.formData();
		const usernameEntry = data.get('username');
		const username = typeof usernameEntry === 'string' ? usernameEntry.trim() : '';
		const ageEntry = data.get('age');
		const ageInput = typeof ageEntry === 'string' ? ageEntry : '';
		const parsedAge = parseInt(ageInput);
		let age: number | undefined = Number.isNaN(parsedAge) ? undefined : parsedAge;
		const emailRaw = data.get('email');
		const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';
		const values = { username, age: ageInput, email: typeof emailRaw === 'string' ? emailRaw : '' };
		if (!username) {
			return fail(400, {
				message: 'Nama pengguna diperlukan.',
				values
			});
		}
		if (!email) {
			return fail(400, {
				message: 'Email diperlukan.',
				values
			});
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, {
				message: 'Format email tidak valid.',
				values
			});
		}
		const password = data.get('password') as string;
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		const normalizedAge = typeof age === 'number' ? age : null;
		try {
			await userService.create({ username, age: normalizedAge, email, passwordHash, isAdmin: false });
		} catch (error) {
			return fail(400, {
				message: 'Gagal membuat pengguna. Pastikan nama pengguna dan email belum digunakan.',
				values
			});
		}
		throw redirect(303, '/user');
	}
};
