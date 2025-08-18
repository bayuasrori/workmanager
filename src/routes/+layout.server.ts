import { organizationService, projectService } from '$lib/server/service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const organizations = await organizationService.getAll();
	const projects = await projectService.getAll();

	// Group projects by organization
	const organizationsWithProjects = organizations.map((org) => ({
		...org,
		projects: projects.filter((proj) => proj.organizationId === org.id)
	}));

	return { organizations: organizationsWithProjects };
};
