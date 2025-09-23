import { db } from '../db';
import { task, type Task } from '../db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { activityService } from './activity';

type TaskActivityOptions = {
	actorId?: string | null;
};

export const taskService = {
	getById: async (id: string) => {
		const data = await db.query.task.findFirst({
			where: eq(task.id, id),
			with: { assignee: true, status: true }
		});
		return data;
	},
	getAll: async () => {
		return await db.query.task.findMany({
			with: { assignee: true, status: true }
		});
	},
	create: async (item: Omit<Task, 'id'>, options?: TaskActivityOptions) => {
		const id = crypto.randomUUID();
		const result = await db.insert(task).values({ ...item, id });
		if (options?.actorId && item.projectId) {
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
			previous = (await db.query.task.findFirst({ where: eq(task.id, id) })) ?? null;
		}
		const updatedRows = await db.update(task).set(item).where(eq(task.id, id)).returning();
		const updated = updatedRows[0];
		if (options?.actorId) {
			const projectId = updated?.projectId ?? previous?.projectId ?? null;
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
						? `Status task "${updated?.name ?? previous?.name ?? ''}" diperbarui`
						: `Task "${updated?.name ?? previous?.name ?? ''}" diperbarui`,
					metadata: Object.keys(metadataPayload).length ? metadataPayload : undefined
				});
			}
		}
		return updatedRows;
	},
	delete: async (id: string, options?: TaskActivityOptions) => {
		let existing: Task | null = null;
		if (options?.actorId) {
			existing = (await db.query.task.findFirst({ where: eq(task.id, id) })) ?? null;
		}
		const result = await db.delete(task).where(eq(task.id, id));
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
		return await db.query.task.findMany({
			where: eq(task.projectId, projectId),
			with: { assignee: true, status: true }
		});
	},
	getByProjectIdAndStatus: async (projectId: string, statusId: string) => {
		return await db.query.task.findMany({
			where: and(eq(task.projectId, projectId), eq(task.statusId, statusId)),
			with: { assignee: true, status: true }
		});
	},
	getUserTaskCount: async (userId: string) => {
		return await db.select({ count: count() }).from(task).where(eq(task.assigneeId, userId));
	},
	getUserTasks: async (userId: string) => {
		return await db.query.task.findMany({
			where: eq(task.assigneeId, userId),
			with: { assignee: true, status: true }
		});
	},
	getTaskVelocity: async () => {
		const query = sql`
			SELECT
				strftime('%Y-%m-%d', a.created_at, 'unixepoch') as date,
				COUNT(CASE WHEN a.type = 'TASK_CREATED' THEN 1 END) as created,
				COUNT(CASE WHEN a.type = 'TASK_STATUS_CHANGED' THEN 1 END) as completed
			FROM
				activity a
			WHERE
				a.created_at >= datetime('now', '-30 days')
				AND a.type IN ('TASK_CREATED', 'TASK_STATUS_CHANGED')
			GROUP BY
				date
			ORDER BY
				date ASC
		`;
		const result = await db.all(query);
		return result as { date: string; created: number; completed: number }[];
	},
	getTaskCompletionRate: async () => {
		const query = sql`
			SELECT
				strftime('%Y-%m', t.start_date, 'unixepoch') as month,
				COUNT(*) as total_tasks,
				COUNT(CASE WHEN t.end_date IS NOT NULL THEN 1 END) as completed_tasks,
				ROUND(COUNT(CASE WHEN t.end_date IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
			FROM
				task t
			WHERE
				t.start_date >= datetime('now', '-12 months')
			GROUP BY
				month
			ORDER BY
				month DESC
		`;
		const result = await db.all(query);
		return result as { month: string; total_tasks: number; completed_tasks: number; completion_rate: number }[];
	},
	getTaskStatusMetrics: async () => {
		const query = sql`
			SELECT
				ts.name as status_name,
				COUNT(t.id) as task_count,
				AVG(CASE 
					WHEN t.start_date IS NOT NULL AND t.end_date IS NOT NULL 
					THEN (julianday(t.end_date) - julianday(t.start_date))
					ELSE NULL 
				END) as avg_completion_days
			FROM
				task_status ts
			LEFT JOIN
				task t ON ts.id = t.status_id
			GROUP BY
				ts.name
			ORDER BY
				task_count DESC
		`;
		const result = await db.all(query);
		return result as { status_name: string; task_count: number; avg_completion_days: number }[];
	}
};
