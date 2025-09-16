import { redirect } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';
import { organizationService, projectService } from '$lib/server/service';

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

	// Load only projects where the user is a member
	let organizations: Array<{ id: string; name: string; projects: any[] }> = [];
	try {
		const memberProjects = user?.id ? await projectService.getByMemberUserId(user.id) : [];
		const orgIds = Array.from(new Set(memberProjects.map((p: any) => p.organizationId).filter(Boolean)));
		const allOrgs = await organizationService.getAll();
		const orgMap = new Map(allOrgs.map((o: any) => [o.id, o]));
		organizations = orgIds
			.map((oid) => orgMap.get(oid))
			.filter((o: any) => o && o.name !== 'Public')
			.map((o: any) => ({
				id: o.id,
				name: o.name,
				projects: memberProjects.filter((p: any) => p.organizationId === o.id && !p.isPublic)
			}));
	} catch (_) {
		organizations = [];
	}
	return { user, organizations };
};
