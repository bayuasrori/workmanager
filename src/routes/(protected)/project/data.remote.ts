import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { organizationService, projectService } from '$lib/server/service';

export const getProjects = query(async () => {
	const { locals } = getRequestEvent();
	const user = locals.user;
	const projects = user?.id ? await projectService.getByMemberUserId(user.id) : [];
	return { projects };
});

export const deleteProject = command(
	v.object({
		projectId: v.string()
	}),
	async ({ projectId }) => {
		const { locals } = getRequestEvent();
		const userId = locals.user?.id;
		if (!userId) {
			throw error(401, 'Unauthorized');
		}
		const project = await projectService.getById(projectId);
		if (!project) {
			throw error(404, 'Project not found');
		}
		if (project.organizationId) {
			const organization = await organizationService.getById(project.organizationId);
			if (!organization) {
				throw error(404, 'Organization not found');
			}
			if (organization.ownerId !== userId) {
				const isMember = await organizationService.isMember(project.organizationId, userId);
				if (!isMember) {
					throw error(403, 'Forbidden');
				}
			}
		}
		await projectService.delete(projectId);
		return { success: true };
	}
);
