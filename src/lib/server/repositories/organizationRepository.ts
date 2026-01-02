import { db } from '../db';
import { organization, organizationMember, type Organization } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';

export const organizationRepository = {
	getById: async (id: string) => {
		const data = await db.select().from(organization).where(eq(organization.id, id));
		return data[0];
	},
	isMember: async (organizationId: string, userId: string) => {
		const member = await db
			.select()
			.from(organizationMember)
			.where(
				and(eq(organizationMember.organizationId, organizationId), eq(organizationMember.userId, userId))
			);
		return member.length > 0;
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
	},
	getProjectCountPerOrganization: async () => {
		const query = sql`
			SELECT
				o.name,
				COUNT(p.id)::int as count
			FROM
				organization o
			LEFT JOIN
				project p ON o.id = p.organization_id
			GROUP BY
				o.name
			ORDER BY
				count DESC
		`;
		const result = await db.all(query);
		return result as { name: string; count: number }[];
	}
};