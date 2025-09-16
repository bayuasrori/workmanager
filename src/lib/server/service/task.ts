import { db } from '../db';
import { task, type Task } from '../db/schema';
import { eq, and, count } from 'drizzle-orm';

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
	create: async (item: Omit<Task, 'id'>) => {
		const id = crypto.randomUUID();
		return await db.insert(task).values({ ...item, id });
	},
	update: async (id: string, item: Partial<Omit<Task, 'id'>>) => {
		return await db.update(task).set(item).where(eq(task.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(task).where(eq(task.id, id));
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
		return await db.select({ count: count()}).from(task)
			.where(eq(task.assigneeId, userId))
	},
	getUserTasks: async (userId: string) => {
		return await db.query.task.findMany({
			where: eq(task.assigneeId, userId),
			with: { assignee: true, status: true }
		});
	}
};
