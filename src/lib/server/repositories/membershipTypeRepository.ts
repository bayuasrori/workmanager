import { db } from '../db';
import { membershipType } from '../db/schema';
import { eq } from 'drizzle-orm';

export const membershipTypeRepository = {
	getById: async (id: string) => {
		const data = await db.select().from(membershipType).where(eq(membershipType.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(membershipType);
	},
	getDefault: async () => {
		const data = await db.select().from(membershipType).where(eq(membershipType.isDefault, true));
		return data[0];
	},
	create: async (item: typeof membershipType.$inferInsert) => {
		const [inserted] = await db.insert(membershipType).values(item).returning();
		return inserted;
	},
	update: async (id: string, item: Partial<Omit<typeof membershipType.$inferInsert, 'id'>>) => {
		const [updated] = await db
			.update(membershipType)
			.set(item)
			.where(eq(membershipType.id, id))
			.returning();
		return updated ?? null;
	},
	delete: async (id: string) => {
		return await db.delete(membershipType).where(eq(membershipType.id, id));
	}
};