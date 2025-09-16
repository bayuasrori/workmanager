import { db } from '../db';
import { task, task_status, type TaskStatus } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const taskStatusService = {
	getById: async (id: string) => {
		const data = await db.select().from(task_status).where(eq(task_status.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(task_status);
	},
	getByProjectId: async (projectId: string) => {
		return await db.select().from(task_status)
			.where(eq(task_status.projectId, projectId))
			.orderBy(task_status.order);
	},
	create: async (item: Omit<TaskStatus, 'id'>) => {
		const id = crypto.randomUUID();
		const inserted = await db.insert(task_status).values({ ...item, id }).returning();
		return inserted[0];
	},
	createForProject: async (projectId: string, name: string) => {
		const id = crypto.randomUUID();
		
		// Get the highest order number for this project
		const existingStatuses = await db.select().from(task_status)
			.where(eq(task_status.projectId, projectId))
			.orderBy(task_status.order);
		
		const nextOrder = existingStatuses.length > 0 
			? Math.max(...existingStatuses.map(s => s.order || 0)) + 1 
			: 1;
		
		return await db.insert(task_status).values({ 
			id, 
			name, 
			projectId, 
			order: nextOrder 
		}).returning();
	},
	update: async (id: string, item: Partial<Omit<TaskStatus, 'id'>>) => {
		return await db.update(task_status).set(item).where(eq(task_status.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(task_status).where(eq(task_status.id, id));
	},
	getTaskCountInStatus: async (projectId?: string) => {
		let query = db
			.select({
				statusId: task_status.id,
				task_status: task_status.name,
				count: sql<number>`count(${task.id})`,
			})
			.from(task_status)
			.leftJoin(task, sql`${task.statusId} = ${task_status.id}`)
			.orderBy(task_status.order)
			.groupBy(task_status.name);

		if (projectId) {
			query = query.where(eq(task_status.projectId, projectId));
		}

		return await query;
	}
};
