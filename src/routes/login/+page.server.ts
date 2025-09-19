import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, {
				message: 'Nama pengguna tidak valid (minimal 3, maksimal 31 karakter, hanya huruf atau angka).'
			});
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Kata sandi tidak valid (minimal 6, maksimal 255 karakter).' });
		}

		const results = await db.select().from(table.user).where(eq(table.user.username, username));

		const existingUser = results.at(0);
		if (!existingUser) {
			return fail(400, { message: 'Nama pengguna atau kata sandi salah.' });
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return fail(400, { message: 'Nama pengguna atau kata sandi salah.' });
		}

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, '/dashboard');
	},
	register: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const email = formData.get('email');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, { message: 'Nama pengguna tidak valid.' });
		}
		if (!validateEmail(email)) {
			return fail(400, { message: 'Email tidak valid.' });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Kata sandi tidak valid.' });
		}

		const normalizedEmail = (email as string).trim().toLowerCase();
		const existingEmail = await db.select().from(table.user).where(eq(table.user.email, normalizedEmail));
		if (existingEmail.length > 0) {
			return fail(400, { message: 'Email sudah terdaftar.' });
		}

		const userId = generateUserId();
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			await db.insert(table.user).values({ id: userId, username, email: normalizedEmail, passwordHash });

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch {
			return fail(500, { message: 'Terjadi kesalahan.' });
		}
		return redirect(302, '/dashboard');
	}
};

function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}

function validateEmail(email: unknown): email is string {
	if (typeof email !== 'string') {
		return false;
	}
	const normalized = email.trim();
	if (!normalized) {
		return false;
	}
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}
