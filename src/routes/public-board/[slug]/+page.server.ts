import { publicBoardService } from '$lib/server/service';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const board = await publicBoardService.getBySlug(params.slug);

	if (!board) {
		throw error(404, 'Public board not found');
	}

	setHeaders({
		'cache-control': 'no-store'
	});

	return { board };
};