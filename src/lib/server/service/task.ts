import { taskRepository } from '../repositories';
import { type Task } from '../db/schema';
import { activityService } from './activity';

type TaskActivityOptions = {
	actorId?: string | null;
};

export const taskService = {
	getById: async (id: string) => {
		return await taskRepository.getById(id);
	},
	getAll: async () => {
		return await taskRepository.getAll();
	},
	create: async (item: Omit<Task, 'id'>, options?: TaskActivityOptions) => {
		const result = await taskRepository.create(item);
		const id = typeof result[0] === 'string' ? result[0] : result[0]?.id;
		if (options?.actorId && item.projectId && id) {
			await activityService.record({
				projectId: item.projectId,
				userId: options.actorId,
				taskId: id,
				type: 'TASK_CREATED',
				description: `Task "${item.name}" dibuat`,
				metadata: { taskId: id }
			});
		}
		return result;
	},
	update: async (id: string, item: Partial<Omit<Task, 'id'>>, options?: TaskActivityOptions) => {
		let previous: Task | null = null;
		if (options?.actorId) {
			previous = (await taskRepository.getById(id)) ?? null;
		}
		const updatedRows = await taskRepository.update(id, item);
		const updated = updatedRows[0];
		if (options?.actorId && updated) {
			const projectId = updated.projectId ?? previous?.projectId ?? null;
			if (projectId) {
				const metadataPayload: Record<string, unknown> = {};
				const changes: Record<string, { old: unknown; new: unknown }> = {};
				if (item.name && previous?.name !== item.name) {
					changes.name = { old: previous?.name, new: item.name };
				}
				if (item.description !== undefined && previous?.description !== item.description) {
					changes.description = { old: previous?.description, new: item.description };
				}
				if (item.statusId && previous?.statusId !== item.statusId) {
					changes.statusId = { old: previous?.statusId, new: item.statusId };
				}
				if (item.assigneeId !== undefined && previous?.assigneeId !== item.assigneeId) {
					changes.assigneeId = { old: previous?.assigneeId, new: item.assigneeId };
				}
				if (item.projectId && previous?.projectId !== item.projectId) {
					changes.projectId = { old: previous?.projectId, new: item.projectId };
				}
				if (item.startDate !== undefined && previous?.startDate !== item.startDate) {
					changes.startDate = { old: previous?.startDate, new: item.startDate };
				}
				if (item.endDate !== undefined && previous?.endDate !== item.endDate) {
					changes.endDate = { old: previous?.endDate, new: item.endDate };
				}
				if (Object.keys(changes).length > 0) {
					metadataPayload.changes = changes;
				}
				const statusChanged = !!item.statusId && previous?.statusId !== item.statusId;
				await activityService.record({
					projectId,
					userId: options.actorId,
					taskId: id,
					type: statusChanged ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
					description: statusChanged
						? `Status task "${updated.name ?? previous?.name ?? ''}" diperbarui`
						: `Task "${updated.name ?? previous?.name ?? ''}" diperbarui`,
					metadata: Object.keys(metadataPayload).length ? metadataPayload : undefined
				});
			}
		}
		return updatedRows;
	},
	delete: async (id: string, options?: TaskActivityOptions) => {
		let existing: Task | null = null;
		if (options?.actorId) {
			existing = (await taskRepository.getById(id)) ?? null;
		}
		const result = await taskRepository.delete(id);
		if (options?.actorId && existing?.projectId) {
			await activityService.record({
				projectId: existing.projectId,
				userId: options.actorId,
				taskId: existing.id,
				type: 'TASK_DELETED',
				description: `Task "${existing.name}" dihapus`,
				metadata: { taskId: existing.id }
			});
		}
		return result;
	},
	getByProjectId: async (projectId: string) => {
		return await taskRepository.getByProjectId(projectId);
	},
	getByProjectIdAndStatus: async (projectId: string, statusId: string) => {
		return await taskRepository.getByProjectIdAndStatus(projectId, statusId);
	},
	getUserTaskCount: async (userId: string) => {
		return await taskRepository.getUserTaskCount(userId);
	},
	getUserTasks: async (userId: string) => {
		return await taskRepository.getUserTasks(userId);
	},
	getTaskVelocity: async () => {
		return await taskRepository.getTaskVelocity();
	},
	getTaskCompletionRate: async () => {
		return await taskRepository.getTaskCompletionRate();
	},
	getTaskStatusMetrics: async () => {
		return await taskRepository.getTaskStatusMetrics();
	}
};