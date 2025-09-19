import {
	taskService,
	projectService,
	userService,
	taskStatusService
} from '$lib/server/service';
import { createTaskComment, deleteTaskComment, getTaskComments } from '$lib/server/service/taskComment';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const task = await taskService.getById(params.id);
	const projects = await projectService.getAll();
	const users = await userService.getAll();

	// Get task statuses for the task's project
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
		.sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		);

	return { task, projects, users, taskStatuses, comments, currentUser: locals.user ?? null };
};

export const actions: Actions = {
	updateTask: async ({ request, params, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const projectId = data.get('projectId') as string;
		const assigneeId = data.get('assigneeId') as string;
		const statusId = data.get('statusId') as string;
		await taskService.update(
			params.id,
			{ name, projectId, assigneeId, statusId },
			{ actorId: locals.user?.id }
		);
		throw redirect(303, '/tasks');
	},
	addComment: async ({ request, params, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}
		const formData = await request.formData();
		const content = formData.get('content');
		if (typeof content !== 'string' || !content.trim()) {
			return fail(400, {
				message: 'Komentar tidak boleh kosong.',
				values: { content: typeof content === 'string' ? content : '' }
			});
		}
		await createTaskComment(content.trim(), params.id, locals.user.id);
		throw redirect(303, `/tasks/${params.id}`);
	},
	deleteComment: async ({ request, params, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}
		const formData = await request.formData();
		const commentId = formData.get('commentId');
		if (typeof commentId !== 'string' || commentId.length === 0) {
			return fail(400, { message: 'Komentar tidak valid.' });
		}
		await deleteTaskComment(commentId, locals.user.id);
		throw redirect(303, `/tasks/${params.id}`);
	}
};
