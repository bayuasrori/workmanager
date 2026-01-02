import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { publicBoardService, taskStatusService } from '$lib/server/service';

// Type definitions


// Query to fetch board data
export const getBoard = query(v.object({ slug: v.string() }), async ({ slug }) => {
	const board = await publicBoardService.getBySlug(slug);
	if (!board) {
		error(404, 'Public board not found');
	}
	return { board };
});

// Command to update task status (for drag and drop)
export const updateTaskStatus = command(
	v.object({
		taskId: v.string(),
		newStatusId: v.string()
	}),
	async ({ taskId, newStatusId }: { taskId: string; newStatusId: string }) => {
		await publicBoardService.updateTaskStatus(taskId, newStatusId);
		return { success: true };
	}
);

// Command to create a new status
export const createStatus = command(
	v.object({
		slug: v.string(),
		name: v.pipe(v.string(), v.nonEmpty('Status name is required'))
	}),
	async ({ slug, name }: { slug: string; name: string }) => {
		const board = await publicBoardService.getBySlug(slug);
		if (!board) {
			error(404, 'Board not found');
		}

		await taskStatusService.createForProject(board.id, name.trim());
		return { success: true };
	}
);

// Command to create a new task
export const createTask = command(
	v.object({
		slug: v.string(),
		name: v.pipe(v.string(), v.nonEmpty('Task name is required')),
		description: v.optional(v.string()),
		statusId: v.optional(v.string())
	}),
	async ({ slug, name, description, statusId }: { slug: string; name: string; description?: string | undefined; statusId?: string | undefined }) => {
		const board = await publicBoardService.getBySlug(slug);
		if (!board) {
			error(404, 'Board not found');
		}

		await publicBoardService.addTask(board.id, {
			name: name.trim(),
			description: description?.trim() || undefined,
			statusId: statusId || undefined
		});

		const newBoard = await publicBoardService.getBySlug(slug);
		if (!newBoard) {
			error(404, 'Board not found');
		}

		return { board: newBoard };
	}
);

// Command to reorder statuses
export const reorderStatuses = command(
	v.object({
		slug: v.string(),
		orderedIds: v.array(v.string())
	}),
	async ({ slug, orderedIds }: { slug: string; orderedIds: string[] }) => {
		if (orderedIds.length === 0) {
			throw error(400, 'No status IDs provided');
		}

		const board = await publicBoardService.getBySlug(slug);
		if (!board) {
			error(404, 'Board not found');
		}

		await taskStatusService.reorderForProject(board.id, orderedIds);
		return { success: true };
	}
);

// Command to update a task
export const updateTask = command(
	v.object({
		taskId: v.pipe(v.string(), v.nonEmpty('Task ID is required')),
		name: v.pipe(v.string(), v.nonEmpty('Task name is required')),
		description: v.optional(v.string())
	}),
	async ({ taskId, name, description }: { taskId: string; name: string; description?: string | undefined }) => {
		await publicBoardService.updateTask(taskId, {
			name: name.trim(),
			description: description?.trim() || null
		});

		const updated = await publicBoardService.getTaskById(taskId);
		return { success: true, task: updated };
	}
);

// Command to delete a task
export const deleteTask = command(v.string(), async (taskId: string) => {
	await publicBoardService.deleteTask(taskId);
});

// Command to delete a status
export const deleteStatus = command(
	v.object({
		slug: v.string(),
		statusId: v.pipe(v.string(), v.nonEmpty('Status ID is required'))
	}),
	async ({ slug, statusId }: { slug: string; statusId: string }) => {
		const board = await publicBoardService.getBySlug(slug);
		if (!board) {
			error(404, 'Board not found');
		}

		const status = await taskStatusService.getById(statusId);
		if (!status || status.projectId !== board.id) {
			error(404, 'Status not found');
		}

		await publicBoardService.deleteTasksByStatus(board.id, statusId);
		await taskStatusService.delete(statusId);
		return { success: true };
	}
);