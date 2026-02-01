import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import {
	projectService,
	taskStatusService,
	publicBoardService,
	organizationService
} from '$lib/server/service';

// Query to refresh project data (project, members, available users, task statuses)
export const getProjectData = query(v.object({ projectId: v.string() }), async ({ projectId }) => {
	const { locals } = getRequestEvent();
	const userId = locals.user?.id;
	if (!userId) {
		error(401, 'Unauthorized');
	}
	const isMember = await projectService.isMember(projectId, userId);
	if (!isMember) {
		error(403, 'You are not a member of this project');
	}
	const result = await projectService.getProjectData(projectId);
	if (!result) {
		error(404, 'Project not found');
	}
	const organizations = await organizationService.getByMemberUserId(userId);
	return { ...result, organizations };
});

// Command to update project details
export const updateProject = command(
	v.object({
		projectId: v.string(),
		name: v.pipe(v.string(), v.nonEmpty('Nama proyek tidak boleh kosong')),
		organizationId: v.optional(v.string())
	}),
	async ({ projectId, name, organizationId }) => {
		await projectService.update(projectId, { name, organizationId });
	}
);

// Command to add a member to project
export const addMember = command(
	v.object({
		projectId: v.string(),
		userId: v.pipe(v.string(), v.nonEmpty('ID pengguna tidak valid'))
	}),
	async ({ projectId, userId }) => {
		await projectService.addMember(projectId, userId);
	}
);

// Command to remove a member from project
export const removeMember = command(
	v.object({
		projectId: v.string(),
		userId: v.pipe(v.string(), v.nonEmpty('ID pengguna tidak valid'))
	}),
	async ({ projectId, userId }) => {
		await projectService.removeMember(projectId, userId);
	}
);

// Command to delete a task status
export const deleteTaskStatus = command(
	v.object({
		statusId: v.pipe(v.string(), v.nonEmpty('ID status tidak valid'))
	}),
	async ({ statusId }) => {
		await taskStatusService.delete(statusId);
	}
);

// Command to convert project to public board
export const makePublic = command(
	v.object({
		projectId: v.string()
	}),
	async ({ projectId }) => {
		const result = await publicBoardService.convertFromProject(projectId);
		if (!result) {
			throw error(404, 'Project not found');
		}
		return { slug: result.slug };
	}
);

// Command to create public board from existing project with user association
export const makePublicForUser = command(
	v.object({
		projectId: v.string()
	}),
	async ({ projectId }) => {
		const { locals } = getRequestEvent();
		const userId = locals.user?.id;
		if (!userId) {
			throw error(401, 'Unauthorized');
		}
		const result = await publicBoardService.createFromProjectForUser(projectId, userId);
		if (!result) {
			throw error(404, 'Project not found');
		}
		return { slug: result.slug };
	}
);
