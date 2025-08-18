import { redirect } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
    const { cookies } = event;
    const token = cookies.get(sessionCookieName);
    if (!token) {
        throw redirect(303, '/login');
    }
    const { session, user } = await validateSessionToken(token);
    if (!session) {
        throw redirect(303, '/login');
    }
    return { user };
};