import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { taskStatusService, projectService } from '$lib/server/service';

export const getTaskStatuses = query(async () => {
	const { locals } = getRequestEvent();
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/login');
	}
	const projects = await projectService.getByMemberUserId(userId);
	const projectIds = projects.map((project) => project.id);
	const taskStatuses = await taskStatusService.getByProjectIds(projectIds);
	return { taskStatuses };
});

export const deleteStatus = command(
	v.object({
		statusId: v.string()
	}),
	async ({ statusId }) => {
		const { locals } = getRequestEvent();
		await taskStatusService.delete(statusId, { actorId: locals.user?.id });
		return { success: true };
	}
);
