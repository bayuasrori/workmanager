import { db } from '../db';
import { user, type User } from '../db/schema';
import { eq } from 'drizzle-orm';

export const userService = {
	getById: async (id: string) => {
		const data = await db.select().from(user).where(eq(user.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(user);
	},
	create: async (item: Omit<User, 'id'>) => {
		const id = crypto.randomUUID();
		const email = item.email?.trim().toLowerCase();
		return await db.insert(user).values({ ...item, id, email });
	},
	update: async (id: string, item: Partial<Omit<User, 'id'>>) => {
		const updated: Partial<Omit<User, 'id'>> = { ...item };
		if (updated.email) {
			updated.email = updated.email.trim().toLowerCase();
		}
		return await db.update(user).set(updated).where(eq(user.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(user).where(eq(user.id, id));
	}
};
