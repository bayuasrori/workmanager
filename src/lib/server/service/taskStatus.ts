import { db } from '../db';
import { task_status, type TaskStatus } from '../db/schema';
import { eq } from 'drizzle-orm';

export const taskStatusService = {
	getById: async (id: string) => {
		const data = await db.select().from(task_status).where(eq(task_status.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(task_status);
	},
	create: async (item: Omit<TaskStatus, 'id'>) => {
		const id = crypto.randomUUID();
		return await db.insert(task_status).values({ ...item, id });
	},
	update: async (id: string, item: Partial<Omit<TaskStatus, 'id'>>) => {
		return await db.update(task_status).set(item).where(eq(task_status.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(task_status).where(eq(task_status.id, id));
	}
};