import { publicBoardService, taskStatusService } from '$lib/server/service';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

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

export const actions: Actions = {
	updateTaskStatus: async ({ request }) => {
		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		const newStatusId = data.get('newStatusId') as string;
		
		if (!taskId || !newStatusId) {
			return fail(400, { success: false, error: 'Missing taskId or newStatusId' });
		}
		
		await publicBoardService.updateTaskStatus(taskId, newStatusId);
		return { success: true };
	},
	getBoard: async ({ params }) => {
		const board = await publicBoardService.getBySlug(params.slug);
		if (!board) {
			return fail(404, { success: false, error: 'Board not found' });
		}
		return { board };
	},
	createStatus: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		
		if (!name || name.trim().length === 0) {
			return fail(400, { success: false, error: 'Status name is required' });
		}
		
		// Get the board to find the project ID
		const board = await publicBoardService.getBySlug(params.slug);
		if (!board) {
			return fail(404, { success: false, error: 'Board not found' });
		}
		
		await taskStatusService.createForProject(board.id, name.trim());
		return { success: true };
	},
	createTask: async ({ request, params }) => {
		const data = await request.formData();
		const name = (data.get('name') as string) || '';
		const description = (data.get('description') as string) || '';
		const statusId = (data.get('statusId') as string) || '';

		if (!name.trim()) {
			return fail(400, { success: false, error: 'Task name is required' });
		}

		const board = await publicBoardService.getBySlug(params.slug);
		if (!board) {
			return fail(404, { success: false, error: 'Board not found' });
		}

		const created = await publicBoardService.addTask(board.id, {
			name: name.trim(),
			description: description.trim() || undefined,
			statusId: statusId || undefined
		});

		const newBoard = await publicBoardService.getBySlug(params.slug);
		if (!newBoard) {
			return fail(404, { success: false, error: 'Board not found' });
		}

		console.log('New board:', newBoard);

		return { board: newBoard };
	},
	updateTask: async ({ request }) => {
		const data = await request.formData();
		const taskId = (data.get('taskId') as string) || '';
		const name = (data.get('name') as string) || '';
		const description = (data.get('description') as string) || '';

		if (!taskId) {
			return fail(400, { success: false, error: 'Task ID is required' });
		}
		if (!name.trim()) {
			return fail(400, { success: false, error: 'Task name is required' });
		}

		await publicBoardService.updateTask(taskId, {
			name: name.trim(),
			description: description.trim() || null
		});

		const updated = await publicBoardService.getTaskById(taskId);
		return { success: true, task: updated };
	},
	deleteTask: async ({ request }) => {
		const data = await request.formData();
		const taskId = (data.get('taskId') as string) || '';
		if (!taskId) return fail(400, { success: false });
		await publicBoardService.deleteTask(taskId);
		return { success: true };
	}
};
