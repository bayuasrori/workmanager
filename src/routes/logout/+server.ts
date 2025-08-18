import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	deleteSessionTokenCookie,
	invalidateSession,
	sessionCookieName,
	validateSessionToken
} from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	const { cookies } = event;
	const token = cookies.get(sessionCookieName);
	if (!token) {
		throw redirect(303, '/login');
	}
	const { session } = await validateSessionToken(token);
	if (session) {
		await invalidateSession(session.id);
	}
	deleteSessionTokenCookie(event);
	throw redirect(303, '/login');
};
