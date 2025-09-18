import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Landing page doesn't require authentication
	// If user is already logged in, we can optionally redirect them to dashboard
	if (locals.user) {
		return { user: locals.user, isAuthenticated: true };
	}

	return { user: null, isAuthenticated: false };
};
