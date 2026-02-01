import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { taskStatusService, projectService } from '$lib/server/service';

const ensureAccess = async (statusId: string) => {
	const { locals } = getRequestEvent();
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/login');
	}
	const taskStatus = await taskStatusService.getById(statusId);
	if (!taskStatus) {
		throw error(404, 'Not Found');
	}
	if (taskStatus.projectId) {
		const isMember = await projectService.isMember(taskStatus.projectId, userId);
		if (!isMember) {
			throw error(403, 'Forbidden');
		}
	}
	return taskStatus;
};

export const getTaskStatusDetails = query(
	v.object({
		statusId: v.string()
	}),
	async ({ statusId }) => {
		const taskStatus = await ensureAccess(statusId);
		return { taskStatus };
	}
);

export const updateStatus = command(
	v.object({
		statusId: v.string(),
		name: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ statusId, name }) => {
		await ensureAccess(statusId);
		const { locals } = getRequestEvent();
		await taskStatusService.update(statusId, { name }, { actorId: locals.user?.id });
		return { success: true };
	}
);
