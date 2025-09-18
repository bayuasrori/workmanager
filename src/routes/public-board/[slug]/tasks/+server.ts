import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { publicBoardService } from '$lib/server/service';

export const GET: RequestHandler = async ({ params }) => {
	const board = await publicBoardService.getBySlug(params.slug);
	if (!board) {
		throw error(404, 'Board not found');
	}
	return json(board);
};
