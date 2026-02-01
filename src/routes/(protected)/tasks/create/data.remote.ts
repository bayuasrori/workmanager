import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { taskService, projectService, userService, taskStatusService } from '$lib/server/service';

export const getTaskCreateData = query(
	v.object({
		projectId: v.optional(v.string())
	}),
	async ({ projectId }) => {
		const projects = await projectService.getAll();
		const users = await userService.getAll();
		const taskStatuses = projectId ? await taskStatusService.getByProjectId(projectId) : [];
		return { projects, users, taskStatuses };
	}
);

export const createTask = command(
	v.object({
		name: v.pipe(v.string(), v.nonEmpty('Nama tugas diperlukan.')),
		projectId: v.optional(v.string()),
		assigneeId: v.optional(v.string()),
		statusId: v.optional(v.string())
	}),
	async ({ name, projectId, assigneeId, statusId }) => {
		const { locals } = getRequestEvent();
		await taskService.create(
			{
				name,
				description: null,
				projectId: projectId ?? null,
				assigneeId: assigneeId ?? null,
				statusId: statusId ?? null,
				startDate: null,
				endDate: null
			},
			{ actorId: locals.user?.id }
		);
		return { success: true };
	}
);
