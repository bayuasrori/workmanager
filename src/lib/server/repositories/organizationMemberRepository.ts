import { db } from '../db';
import { organizationMember, type OrganizationMember } from '../db/schema';
import { and, eq } from 'drizzle-orm';

export const organizationMemberRepository = {
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
	getByOrganizationId: async (organizationId: string) => {
		return await db.query.organizationMember.findMany({
			where: eq(organizationMember.organizationId, organizationId),
			with: {
				user: true
			}
		});
	},
	isMember: async (organizationId: string, userId: string) => {
		const member = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, organizationId),
				eq(organizationMember.userId, userId)
			)
		});
		return !!member;
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