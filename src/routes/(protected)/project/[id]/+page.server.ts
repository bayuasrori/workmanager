import { projectService, organizationService, userService, taskStatusService } from '$lib/server/service';
import { db } from '$lib/server/db';
import { projectMember, user } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const project = await projectService.getById(params.id);
	if (!project) {
		throw error(404, 'Project not found');
	}

	const isMember = await projectService.isMember(params.id, userId);
	if (!isMember) {
		throw error(403, 'You are not a member of this project');
	}

	const organizations = await organizationService.getByMemberUserId(userId);
	const projectMembers = await db
		.select({
			userId: projectMember.userId,
			username: user.username,
			email: user.email
		})
		.from(projectMember)
		.innerJoin(user, eq(user.id, projectMember.userId))
		.where(eq(projectMember.projectId, params.id));
	
	const users = await userService.getAll();
	const availableUsers = users.filter((u) => !projectMembers.some((pm) => pm.userId === u.id));
	const taskStatuses = await taskStatusService.getByProjectId(params.id);

	return { project, organizations, projectMembers, availableUsers, taskStatuses };
};