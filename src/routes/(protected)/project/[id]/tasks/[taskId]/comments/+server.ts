import { json } from '@sveltejs/kit';
import * as taskCommentService from '$lib/server/service/taskComment';

export const POST = async ({ request, locals, params }) => {
	const { content } = await request.json();
	const { user } = locals;
	const { taskId } = params;

	if (!user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const newComment = await taskCommentService.createTaskComment(content, taskId, user.id);

	return json(newComment);
};

export const GET = async ({ params }) => {
	const { taskId } = params;

	const comments = await taskCommentService.getTaskComments(taskId);

	return json(comments);
};

export const DELETE = async ({ request, locals }) => {
	const { id } = await request.json();
	const { user } = locals;

	if (!user) {
		return new Response('Unauthorized', { status: 401 });
	}

	await taskCommentService.deleteTaskComment(id, user.id);

	return new Response(null, { status: 204 });
};
