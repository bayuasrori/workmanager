import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { userService } from '$lib/server/service';

const ensureAccess = (userId: string) => {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (locals.user.id !== userId && !locals.user.isAdmin) {
		throw error(403, 'Forbidden');
	}
	return locals.user;
};

export const getUserDetails = query(
	v.object({
		userId: v.string()
	}),
	async ({ userId }) => {
		ensureAccess(userId);
		const user = await userService.getById(userId);
		return { user };
	}
);

export const updateUser = command(
	v.object({
		userId: v.string(),
		username: v.pipe(v.string(), v.nonEmpty()),
		age: v.optional(v.number()),
		email: v.pipe(v.string(), v.nonEmpty()),
		oldPassword: v.optional(v.string()),
		newPassword: v.optional(v.string())
	}),
	async ({ userId, username, age, email, oldPassword, newPassword }) => {
		ensureAccess(userId);
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			throw error(400, 'Email diperlukan.');
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			throw error(400, 'Format email tidak valid.');
		}

		const user = await userService.getById(userId);
		if (!user) {
			throw error(404, 'User not found.');
		}

		let passwordHash = user.passwordHash;

		if (newPassword) {
			const { hash, verify } = await import('@node-rs/argon2');
			if (!oldPassword) {
				throw error(400, 'Old password is required to change password.');
			}
			const validOldPassword = await verify(passwordHash, oldPassword);
			if (!validOldPassword) {
				throw error(400, 'Old password does not match.');
			}
			passwordHash = await hash(newPassword);
		}

		const normalizedAge = typeof age === 'number' ? age : null;
		try {
			await userService.update(userId, {
				username,
				age: normalizedAge,
				email: normalizedEmail,
				passwordHash
			});
		} catch {
			throw error(
				400,
				'Gagal memperbarui pengguna. Pastikan nama pengguna dan email belum digunakan.'
			);
		}
		return { success: true };
	}
);
