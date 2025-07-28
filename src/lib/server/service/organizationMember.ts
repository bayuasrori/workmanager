import { db } from '../db';
import { organizationMember, type OrganizationMember } from '../db/schema';
import { and, eq } from 'drizzle-orm';

export const organizationMemberService = {
	get: async (organizationId: string, userId: string) => {
		const data = await db
			.select()
			.from(organizationMember)
			.where(
				and(
					eq(organizationMember.organizationId, organizationId),
					eq(organizationMember.userId, userId)
				)
			);
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(organizationMember);
	},
	create: async (item: OrganizationMember) => {
		return await db.insert(organizationMember).values(item);
	},
	delete: async (organizationId: string, userId: string) => {
		return await db
			.delete(organizationMember)
			.where(
				and(
					eq(organizationMember.organizationId, organizationId),
					eq(organizationMember.userId, userId)
				)
			);
	}
};
