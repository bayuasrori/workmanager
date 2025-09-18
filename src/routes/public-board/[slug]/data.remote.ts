import { query } from '$app/server';
import { publicBoardService } from '$lib/server/service';

type LoadInput = { params: { slug: string } };

export const load = query('unchecked', async ({ params }: LoadInput) => {
	const board = await publicBoardService.getBySlug(params.slug);
	return { board };
});
