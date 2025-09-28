import { db } from '../db';
import { task, task_status, type TaskStatus } from '../db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { activityService } from './activity';

type TaskStatusActivityOptions = {
	actorId?: string | null;
};

export const taskStatusService = {
	getById: async (id: string) => {
		const data = await db.select().from(task_status).where(eq(task_status.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(task_status);
	},
	getByProjectId: async (projectId: string) => {
		return await db
			.select()
			.from(task_status)
			.where(eq(task_status.projectId, projectId))
			.orderBy(task_status.order);
	},
	getByProjectIds: async (projectIds: string[]) => {
		if (projectIds.length === 0) {
			return [];
		}
		return await db.select().from(task_status).where(inArray(task_status.projectId, projectIds));
	},
	create: async (item: Omit<TaskStatus, 'id'>, options?: TaskStatusActivityOptions) => {
		const id = crypto.randomUUID();
		const inserted = await db
			.insert(task_status)
			.values({ ...item, id })
			.returning();
		const record = inserted[0];
		if (record && options?.actorId && record.projectId) {
			await activityService.record({
				projectId: record.projectId,
				userId: options.actorId,
				type: 'TASK_STATUS_CREATED',
				description: `Status "${record.name}" dibuat`,
				metadata: { statusId: record.id }
			});
		}
		return inserted[0];
	},
	createForProject: async (projectId: string, name: string, options?: TaskStatusActivityOptions) => {
		const id = crypto.randomUUID();

		// Get the highest order number for this project
		const existingStatuses = await db
			.select()
			.from(task_status)
			.where(eq(task_status.projectId, projectId))
			.orderBy(task_status.order);

		const nextOrder =
			existingStatuses.length > 0 ? Math.max(...existingStatuses.map((s) => s.order || 0)) + 1 : 1;

		const inserted = await db
			.insert(task_status)
			.values({
				id,
				name,
				projectId,
				order: nextOrder
			})
			.returning();
		const record = inserted[0];
		if (record && options?.actorId) {
			await activityService.record({
				projectId,
				userId: options.actorId,
				type: 'TASK_STATUS_CREATED',
				description: `Status "${record.name}" ditambahkan ke proyek`,
				metadata: { statusId: record.id }
			});
		}
		return inserted[0];
	},
	update: async (id: string, item: Partial<Omit<TaskStatus, 'id'>>, options?: TaskStatusActivityOptions) => {
		let previous: TaskStatus | null = null;
		if (options?.actorId) {
			previous = (await db.query.task_status.findFirst({ where: eq(task_status.id, id) })) ?? null;
		}
		const updatedRows = await db.update(task_status).set(item).where(eq(task_status.id, id)).returning();
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
			existing = (await db.query.task_status.findFirst({ where: eq(task_status.id, id) })) ?? null;
		}
		const result = await db.delete(task_status).where(eq(task_status.id, id));
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
		const baseQuery = db
			.select({
				statusId: task_status.id,
				task_status: task_status.name,
				count: sql<number>`count(${task.id})`
			})
			.from(task_status)
			.leftJoin(task, sql`${task.statusId} = ${task_status.id}`)
			.groupBy(task_status.id, task_status.name, task_status.order)
			.orderBy(task_status.order);

		if (projectId) {
			return await baseQuery.where(eq(task_status.projectId, projectId));
		}

		return await baseQuery;
	},
	reorderForProject: async (projectId: string, orderedIds: string[], options?: TaskStatusActivityOptions) => {
		const existing = await db
			.select({ id: task_status.id })
			.from(task_status)
			.where(eq(task_status.projectId, projectId));

		const validIds = new Set(existing.map((status) => status.id));
		const deduped = orderedIds.filter((id, index) => orderedIds.indexOf(id) === index);
		const filtered = deduped.filter((id) => validIds.has(id));
		const remaining = existing.map((status) => status.id).filter((id) => !filtered.includes(id));
		const finalOrder = [...filtered, ...remaining];

		await db.transaction(async (tx) => {
			for (const [index, statusId] of finalOrder.entries()) {
				await tx
					.update(task_status)
					.set({ order: index + 1 })
					.where(eq(task_status.id, statusId));
			}
		});
		if (options?.actorId) {
			await activityService.record({
				projectId,
				userId: options.actorId,
				type: 'TASK_STATUS_REORDERED',
				description: 'Urutan status diperbarui',
				metadata: { orderedIds: finalOrder }
			});
		}
	}
};
