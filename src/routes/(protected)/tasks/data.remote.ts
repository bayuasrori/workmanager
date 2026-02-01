import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { taskService } from '$lib/server/service';

export const getTasks = query(async () => {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	const tasks = await taskService.getUserTasks(locals.user.id);
	return { tasks };
});

export const deleteTask = command(
	v.object({
		taskId: v.string()
	}),
	async ({ taskId }) => {
		const { locals } = getRequestEvent();
		await taskService.delete(taskId, { actorId: locals.user?.id });
		return { success: true };
	}
);
