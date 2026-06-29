import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { taskService, projectService, userService, taskStatusService } from '$lib/server/service';
import {
	createTaskComment,
	deleteTaskComment,
	getTaskComments
} from '$lib/server/service/taskComment';

export const getTaskDetails = query(
	v.object({
		taskId: v.string()
	}),
	async ({ taskId }) => {
		// Empty taskId happens during route teardown/navigation transitions —
		// short-circuit instead of passing "" to a uuid column query.
		if (!taskId) {
			return { task: null, projects: [], users: [], taskStatuses: [], comments: [], currentUser: null };
		}
		const task = await taskService.getById(taskId);
		const projects = await projectService.getAll();
		const users = await userService.getAll();
		const taskStatuses = task?.projectId
			? await taskStatusService.getByProjectId(task.projectId)
			: [];
		const commentsRaw = task ? await getTaskComments(task.id) : [];
		const userMap = new Map(users.map((user) => [user.id, user]));
		const comments = commentsRaw
			.map((comment) => {
				const username = comment.userId ? userMap.get(comment.userId)?.username : undefined;
				return {
					...comment,
					username: username ?? 'Unknown user'
				};
			})
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		const { locals } = getRequestEvent();
		return { task, projects, users, taskStatuses, comments, currentUser: locals.user ?? null };
	}
);

export const updateTask = command(
	v.object({
		taskId: v.string(),
		name: v.pipe(v.string(), v.nonEmpty()),
		projectId: v.string(),
		assigneeId: v.optional(v.string()),
		statusId: v.optional(v.string()),
		startDate: v.optional(v.union([v.date(), v.null()])),
		endDate: v.optional(v.union([v.date(), v.null()]))
	}),
	async ({ taskId, name, projectId, assigneeId, statusId, startDate, endDate }) => {
		const { locals } = getRequestEvent();
		await taskService.update(
			taskId,
			{
				name,
				projectId,
				assigneeId,
				statusId,
				...(startDate !== undefined ? { startDate } : {}),
				...(endDate !== undefined ? { endDate } : {})
			},
			{ actorId: locals.user?.id }
		);
		return { success: true };
	}
);

export const addComment = command(
	v.object({
		taskId: v.string(),
		content: v.pipe(v.string(), v.nonEmpty('Komentar tidak boleh kosong.'))
	}),
	async ({ taskId, content }) => {
		const { locals } = getRequestEvent();
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}
		await createTaskComment(content.trim(), taskId, locals.user.id);
		return { success: true };
	}
);

export const removeComment = command(
	v.object({
		commentId: v.string()
	}),
	async ({ commentId }) => {
		const { locals } = getRequestEvent();
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}
		await deleteTaskComment(commentId, locals.user.id);
		return { success: true };
	}
);
