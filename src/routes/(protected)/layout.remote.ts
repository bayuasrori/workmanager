import { query, getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { organizationService, projectService } from '$lib/server/service';
import type { Organization } from '$lib/server/db/schema';

const buildOrganizations = async (userId: string) => {
	const memberProjects = await projectService.getByMemberUserId(userId);
	const orgIds = Array.from(
		new Set(
			memberProjects
				.map((project) => project.organizationId)
				.filter((id): id is string => typeof id === 'string' && id.length > 0)
		)
	);
	const allOrgs = await organizationService.getAll();
	const orgMap = new Map(allOrgs.map((organization) => [organization.id, organization]));
	return orgIds
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
};

export const getLayoutData = query(async () => {
	const { locals } = getRequestEvent();
	const user = locals.user;
	if (!user) {
		throw redirect(303, '/login');
	}

	let organizations = [] as Awaited<ReturnType<typeof buildOrganizations>>;
	try {
		organizations = await buildOrganizations(user.id);
	} catch {
		organizations = [];
	}

	return { user, organizations };
});
