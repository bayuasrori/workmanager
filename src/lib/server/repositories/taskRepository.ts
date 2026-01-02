import { db } from '../db';
import { task, type Task } from '../db/schema';
import { eq, and, count, sql } from 'drizzle-orm';

export const taskRepository = {
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
	create: async (item: Omit<Task, 'id'>) => {
		const id = crypto.randomUUID();
		const result = await db.insert(task).values({ ...item, id }).returning();
		return result;
	},
	update: async (id: string, item: Partial<Omit<Task, 'id'>>) => {
		const updatedRows = await db.update(task).set(item).where(eq(task.id, id)).returning();
		return updatedRows;
	},
	delete: async (id: string) => {
		const result = await db.delete(task).where(eq(task.id, id));
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
				TO_CHAR(a.created_at, 'YYYY-MM-DD') as date,
				COUNT(CASE WHEN a.type = 'TASK_CREATED' THEN 1 END)::int as created,
				COUNT(CASE WHEN a.type = 'TASK_STATUS_CHANGED' THEN 1 END)::int as completed
			FROM
				activity a
			WHERE
				a.created_at >= NOW() - INTERVAL '30 days'
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
				TO_CHAR(t.start_date, 'YYYY-MM') as month,
				COUNT(*)::int as total_tasks,
				COUNT(CASE WHEN t.end_date IS NOT NULL THEN 1 END)::int as completed_tasks,
				ROUND(COUNT(CASE WHEN t.end_date IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as completion_rate
			FROM
				task t
			WHERE
				t.start_date >= NOW() - INTERVAL '12 months'
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
				COUNT(t.id)::int as task_count,
				AVG(CASE 
					WHEN t.start_date IS NOT NULL AND t.end_date IS NOT NULL 
					THEN EXTRACT(EPOCH FROM (t.end_date - t.start_date)) / 86400.0
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