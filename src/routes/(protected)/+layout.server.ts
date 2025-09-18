import { redirect } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';
import { organizationService, projectService } from '$lib/server/service';
import type { Organization } from '$lib/server/db/schema';

type MemberProject = Awaited<ReturnType<typeof projectService.getByMemberUserId>>[number];
type OrganizationSummary = {
	id: string;
	name: string;
	projects: MemberProject[];
};

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
	let organizations: OrganizationSummary[] = [];
	try {
		const memberProjects = user?.id ? await projectService.getByMemberUserId(user.id) : [];
		const orgIds = Array.from(
			new Set(
				memberProjects
					.map((project) => project.organizationId)
					.filter((id): id is string => typeof id === 'string' && id.length > 0)
			)
		);
		const allOrgs = await organizationService.getAll();
		const orgMap = new Map(allOrgs.map((organization) => [organization.id, organization]));
		organizations = orgIds
			.map((organizationId) => orgMap.get(organizationId))
			.filter((organization): organization is Organization => {
				if (!organization) return false;
				return organization.name !== 'Public';
			})
			.map((organization) => ({
				id: organization.id,
				name: organization.name,
				projects: memberProjects.filter(
					(project) => project.organizationId === organization.id && !project.isPublic
				)
			}));
	} catch {
		organizations = [];
	}
	return { user, organizations };
};
