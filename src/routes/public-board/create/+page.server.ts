import { publicBoardService } from '$lib/server/service';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Public board creation doesn't require authentication
	// But if user is logged in, we can associate the board with them
	return { 
		user: locals.user || null,
		isAuthenticated: !!locals.user 
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;

		if (!name || name.trim().length === 0) {
			return fail(400, { message: 'Board name is required' });
		}

		if (name.length > 100) {
			return fail(400, { message: 'Board name must be less than 100 characters' });
		}

		let board;
		try {
			board = await publicBoardService.create({
				name: name.trim(),
				description: description?.toString().trim() || undefined,
				createdBy: locals.user?.id || undefined
			});
		} catch (error) {
			console.error('Error creating public board:', error);
			return fail(500, { message: 'Failed to create board. Please try again.' });
		}

		console.log('Created board:', board);
		
		if (!board || !board.slug) {
			return fail(500, { message: 'Board creation failed - no slug returned' });
		}

		// Redirect to the created board (throw, don't return, and don't catch)
		throw redirect(303, `/public-board/${board.slug}`);
	}
};
