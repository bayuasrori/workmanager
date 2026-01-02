import { taskStatusRepository } from '../repositories';
import { type TaskStatus } from '../db/schema';
import { activityService } from './activity';


type TaskStatusActivityOptions = {
	actorId?: string | null;
};

export const taskStatusService = {
	getById: async (id: string) => {
		return await taskStatusRepository.getById(id);
	},
	getAll: async () => {
		return await taskStatusRepository.getAll();
	},
	getByProjectId: async (projectId: string) => {
		return await taskStatusRepository.getByProjectId(projectId);
	},
	getByProjectIds: async (projectIds: string[]) => {
		return await taskStatusRepository.getByProjectIds(projectIds);
	},
	create: async (item: Omit<TaskStatus, 'id'>, options?: TaskStatusActivityOptions) => {
		const record = await taskStatusRepository.create(item);
		if (record && options?.actorId && record.projectId) {
			await activityService.record({
				projectId: record.projectId,
				userId: options.actorId,
				type: 'TASK_STATUS_CREATED',
				description: `Status "${record.name}" dibuat`,
				metadata: { statusId: record.id }
			});
		}
		return record;
	},
	createForProject: async (projectId: string, name: string, options?: TaskStatusActivityOptions) => {
		const record = await taskStatusRepository.createForProject(projectId, name);
		if (record && options?.actorId) {
			await activityService.record({
				projectId,
				userId: options.actorId,
				type: 'TASK_STATUS_CREATED',
				description: `Status "${record.name}" ditambahkan ke proyek`,
				metadata: { statusId: record.id }
			});
		}
		return record;
	},
	update: async (id: string, item: Partial<Omit<TaskStatus, 'id'>>, options?: TaskStatusActivityOptions) => {
		let previous: TaskStatus | null = null;
		if (options?.actorId) {
			previous = (await taskStatusRepository.getById(id)) ?? null;
		}
		const updatedRows = await taskStatusRepository.update(id, item);
		const updated = updatedRows[0];
		const projectId = updated?.projectId ?? previous?.projectId ?? null;
		if (options?.actorId && projectId && updated) {
			const changes: Record<string, { old: unknown; new: unknown }> = {};
			if (item.name && item.name !== previous?.name) {
				changes.name = { old: previous?.name, new: item.name };
			}
			if (item.order !== undefined && item.order !== previous?.order) {
				changes.order = { old: previous?.order, new: item.order };
			}
			await activityService.record({
				projectId,
				userId: options.actorId,
				type: 'TASK_STATUS_UPDATED',
				description: `Status "${updated.name}" diperbarui`,
				metadata: Object.keys(changes).length ? { changes } : undefined
			});
		}
		return updatedRows;
	},
	delete: async (id: string, options?: TaskStatusActivityOptions) => {
		let existing: TaskStatus | null = null;
		if (options?.actorId) {
			existing = (await taskStatusRepository.getById(id)) ?? null;
		}
		const result = await taskStatusRepository.delete(id);
		if (options?.actorId && existing?.projectId) {
			await activityService.record({
				projectId: existing.projectId,
				userId: options.actorId,
				type: 'TASK_STATUS_DELETED',
				description: `Status "${existing.name}" dihapus`,
				metadata: { statusId: existing.id }
			});
		}
		return result;
	},
	getTaskCountInStatus: async (projectId?: string) => {
		return await taskStatusRepository.getTaskCountInStatus(projectId);
	},
	reorderForProject: async (projectId: string, orderedIds: string[], options?: TaskStatusActivityOptions) => {
		await taskStatusRepository.reorderForProject(projectId, orderedIds);
		if (options?.actorId) {
			await activityService.record({
				projectId,
				userId: options.actorId,
				type: 'TASK_STATUS_REORDERED',
				description: 'Urutan status diperbarui',
				metadata: { orderedIds }
			});
		}
	}
};