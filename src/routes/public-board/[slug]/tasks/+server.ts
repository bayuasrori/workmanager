import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { publicBoardService } from '$lib/server/service';

export const GET: RequestHandler = async ({ params }) => {
	const board = await publicBoardService.getBySlug(params.slug);
    if (!board) {
        return fail(404, { success: false, error: 'Board not found' });
    }
    return new Response(JSON.stringify(board));
};