import { db } from '../db';
import { project, type Project } from '../db/schema';
import { eq } from 'drizzle-orm';

export const projectService = {
	getById: async (id: string) => {
		const data = await db.select().from(project).where(eq(project.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(project);
	},
	create: async (item: Omit<Project, 'id'>) => {
		const id = crypto.randomUUID();
		return await db.insert(project).values({ ...item, id });
	},
	update: async (id: string, item: Partial<Omit<Project, 'id'>>) => {
		return await db.update(project).set(item).where(eq(project.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(project).where(eq(project.id, id));
	}
};
