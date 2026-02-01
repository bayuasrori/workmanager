import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { userService } from '$lib/server/service';
import { hash } from '@node-rs/argon2';

const requireAdmin = () => {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (!locals.user.isAdmin) {
		throw error(403, 'Forbidden');
	}
	return locals.user;
};

export const getUserCreateAccess = query(() => {
	requireAdmin();
	return { allowed: true };
});

export const createUser = command(
	v.object({
		username: v.pipe(v.string(), v.nonEmpty('Nama pengguna diperlukan.')),
		age: v.optional(v.number()),
		email: v.pipe(v.string(), v.nonEmpty('Email diperlukan.')),
		password: v.pipe(v.string(), v.nonEmpty('Password diperlukan.'))
	}),
	async ({ username, age, email, password }) => {
		requireAdmin();
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		const normalizedAge = typeof age === 'number' ? age : null;
		await userService.create({
			username,
			age: normalizedAge,
			email: email.toLowerCase(),
			passwordHash,
			isAdmin: false
		});
		return { success: true };
	}
);
