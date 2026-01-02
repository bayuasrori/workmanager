import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { taskService, taskStatusService, projectService } from '$lib/server/service';


// Query to refresh project data (tasks, statuses, project info)
export const getProjectTasks = query(
	v.object({
		projectId: v.string(),
		statusId: v.optional(v.string())
	}),
	async ({ projectId, statusId }) => {
		const tasks = statusId
			? await taskService.getByProjectIdAndStatus(projectId, statusId)
			: await taskService.getByProjectId(projectId);
		const taskStatuses = await taskStatusService.getByProjectId(projectId);
		const project = await projectService.getById(projectId);
		
		if (!project) {
			error(404, 'Project not found');
		}

		return {
			tasks,
			taskStatuses,
			project
		};
	}
);

// Command to update task status (for drag and drop)
export const updateTaskStatus = command(
	v.object({
		taskId: v.string(),
		newStatusId: v.string()
	}),
	async ({ taskId, newStatusId }) => {
		await taskService.update(taskId, { statusId: newStatusId });
	}
);

// Command to create a new status
export const createStatus = command(
	v.object({
		projectId: v.string(),
		name: v.pipe(v.string(), v.nonEmpty('Status name is required'))
	}),
	async ({ projectId, name }) => {
		const created = await taskStatusService.createForProject(projectId, name.trim());
		return created;
	}
);

// Command to reorder statuses
export const reorderStatuses = command(
	v.object({
		projectId: v.string(),
		orderedIds: v.array(v.string())
	}),
	async ({ projectId, orderedIds }) => {
		if (orderedIds.length === 0) {
			throw error(400, 'No status IDs provided');
		}
		await taskStatusService.reorderForProject(projectId, orderedIds);
	}
);

// Command to delete a project
export const deleteProject = command(
	v.object({
		projectId: v.string(),
		organizationId: v.optional(v.string()),
		isOwner: v.optional(v.boolean())
	}),
	async ({ projectId }) => {
		// Additional authorization checks would happen here
		// For now, we'll trust the service layer handles it
		await projectService.deleteCascade(projectId);
	}
);

// Command to delete a task status
export const deleteTaskStatus = command(
	v.object({
		statusId: v.pipe(v.string(), v.nonEmpty('Status ID is required'))
	}),
	async ({ statusId }) => {
		await taskStatusService.delete(statusId);
	}
);

// Command to create a new task
export const createTask = command(
	v.object({
		projectId: v.pipe(v.string(), v.nonEmpty('Project ID is required')),
		name: v.pipe(v.string(), v.nonEmpty('Task name is required')),
		description: v.optional(v.string()),
		statusId: v.optional(v.string()),
		assigneeId: v.optional(v.string())
	}),
	async ({ projectId, name, description, statusId, assigneeId }) => {
		await taskService.create({
			name,
			description: description || null,
			projectId,
			assigneeId: assigneeId || null,
			statusId: statusId || null,
			startDate: null,
			endDate: null
		});
	}
);

// Command to update a task
export const updateTask = command(
	v.object({
		taskId: v.pipe(v.string(), v.nonEmpty('Task ID is required')),
		name: v.pipe(v.string(), v.nonEmpty('Task name is required')),
		description: v.optional(v.string())
	}),
	async ({ taskId, name, description }) => {
		await taskService.update(taskId, {
			name,
			description: description || null
		});
	}
);

// Command to delete a task
export const deleteTask = command(
	v.object({
		taskId: v.pipe(v.string(), v.nonEmpty('Task ID is required'))
	}),
	async ({ taskId }) => {
		await taskService.delete(taskId);
	}
);