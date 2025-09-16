
import { query } from '$app/server';
import { publicBoardService } from '$lib/server/service';


export const load = query(async ({ params }) => {
	const board = await publicBoardService.getBySlug(params.slug);
	return { board };
});