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

		await publicBoardService.addTask(board.id, {
			name: name.trim(),
			description: description.trim() || undefined,
			statusId: statusId || undefined
		});

		const newBoard = await publicBoardService.getBySlug(params.slug);
		if (!newBoard) {
			return fail(404, { success: false, error: 'Board not found' });
		}

		return { board: newBoard };
	},
	reorderStatuses: async ({ request, params }) => {
		try {
			const formData = await request.formData();
			const raw = formData.get('orderedIds');
			if (typeof raw !== 'string') {
				return fail(400, { success: false, error: 'Invalid payload' });
			}
			let orderedIds: string[] = [];
			try {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					orderedIds = parsed.map(String);
				}
			} catch (error) {
				console.error('Failed to parse reordered status payload', error);
				return fail(400, { success: false, error: 'Invalid payload' });
			}

			if (orderedIds.length === 0) {
				return fail(400, { success: false, error: 'No status IDs provided' });
			}

			const board = await publicBoardService.getBySlug(params.slug);
			if (!board) {
				return fail(404, { success: false, error: 'Board not found' });
			}

			await taskStatusService.reorderForProject(board.id, orderedIds);
			return { success: true };
		} catch (error) {
			console.error('Failed to reorder statuses', error);
			return fail(500, { success: false, error: 'Failed to reorder statuses' });
		}
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
	},
	deleteStatus: async ({ request, params }) => {
		const data = await request.formData();
		const statusId = (data.get('statusId') as string) || '';
		if (!statusId) {
			return fail(400, { success: false, error: 'Status ID is required' });
		}

		const board = await publicBoardService.getBySlug(params.slug);
		if (!board) {
			return fail(404, { success: false, error: 'Board not found' });
		}

		const status = await taskStatusService.getById(statusId);
		if (!status || status.projectId !== board.id) {
			return fail(404, { success: false, error: 'Status not found' });
		}

		await publicBoardService.deleteTasksByStatus(board.id, statusId);
		await taskStatusService.delete(statusId);
		return { success: true };
	}
};
