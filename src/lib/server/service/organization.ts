import { db } from '../db';
import { organization, organizationMember, type Organization } from '../db/schema';
import { eq } from 'drizzle-orm';

export const organizationService = {
	getById: async (id: string) => {
		const data = await db.select().from(organization).where(eq(organization.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(organization);
	},
	getByMemberUserId: async (userId: string) => {
		return await db
			.select({
				id: organization.id,
				name: organization.name,
				ownerId: organization.ownerId
			})
			.from(organization)
			.innerJoin(organizationMember, eq(organizationMember.organizationId, organization.id))
			.where(eq(organizationMember.userId, userId));
	},
	create: async (item: Omit<Organization, 'id'>) => {
		const id = crypto.randomUUID();
		const inserted = await db
			.insert(organization)
			.values({ ...item, id })
			.returning();
		return inserted[0];
	},
	update: async (id: string, item: Partial<Omit<Organization, 'id'>>) => {
		return await db.update(organization).set(item).where(eq(organization.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(organization).where(eq(organization.id, id));
	}
};
