import { db } from '../db';
import { session, type Session } from '../db/schema';
import { eq } from 'drizzle-orm';

export const sessionService = {
	getById: async (id: string) => {
		const data = await db.select().from(session).where(eq(session.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(session);
	},
	create: async (item: Omit<Session, 'id'>) => {
		return await db.insert(session).values(item);
	},
	update: async (id: string, item: Partial<Omit<Session, 'id'>>) => {
		return await db.update(session).set(item).where(eq(session.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(session).where(eq(session.id, id));
	}
};
