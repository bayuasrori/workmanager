import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { projectService, taskStatusService } from '$lib/server/service';

// Query to refresh project data (project, members, available users, task statuses)
export const getProjectData = query(v.object({ projectId: v.string() }), async ({ projectId }) => {
	const result = await projectService.getProjectData(projectId);
	if (!result) {
		error(404, 'Project not found');
	}
	return result;
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