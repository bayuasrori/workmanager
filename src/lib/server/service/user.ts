import { db } from '../db';
import { user, type User, userMembership, membershipType, organizationMember } from '../db/schema';
import { eq, sql, desc, isNull, or, gt, notInArray } from 'drizzle-orm';

export const userService = {
	getById: async (id: string) => {
		const data = await db.select().from(user).where(eq(user.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(user);
	},
	getUsersNotInOrganization: async (organizationId: string) => {
		const subquery = db
			.select({ userId: organizationMember.userId })
			.from(organizationMember)
			.where(eq(organizationMember.organizationId, organizationId));

		return await db.select().from(user).where(notInArray(user.id, subquery));
	},
	create: async (item: Omit<User, 'id' | 'createdAt'>) => {
		const id = crypto.randomUUID();
		const email = item.email?.trim().toLowerCase();
		return await db.insert(user).values({ ...item, id, email, createdAt: new Date() });
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
	},
	getNewUsersPerDay: async () => {
		const query = sql`
			SELECT
				DATE(created_at) AS date,
				COUNT(*)::int AS count
			FROM
				"user"
			GROUP BY
				DATE(created_at)
			ORDER BY
				DATE(created_at) ASC
		`;
		return await db.all<{ date: string; count: number }>(query);
	},
	getUserJourneyFunnel: async () => {
		const query = sql`
			SELECT
				'Total Users' as stage,
				COUNT(DISTINCT u.id)::int as count,
				100.0 as percentage
			FROM "user" u
			UNION ALL
			SELECT
				'Created Project' as stage,
				COUNT(DISTINCT pm.user_id)::int as count,
				ROUND(COUNT(DISTINCT pm.user_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM "user"), 0), 2) as percentage
			FROM project_member pm
			UNION ALL
			SELECT
				'Added Tasks' as stage,
				COUNT(DISTINCT t.assignee_id)::int as count,
				ROUND(COUNT(DISTINCT t.assignee_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM "user"), 0), 2) as percentage
			FROM task t WHERE t.assignee_id IS NOT NULL
			UNION ALL
			SELECT
				'Active in Team' as stage,
				COUNT(DISTINCT a.user_id)::int as count,
				ROUND(COUNT(DISTINCT a.user_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM "user"), 0), 2) as percentage
			FROM activity a
			WHERE a.created_at >= NOW() - INTERVAL '30 days'
		`;
		const result = await db.all(query);
		return result as { stage: string; count: number; percentage: number }[];
	},
	getUserRetentionRate: async () => {
		const query = sql`
			SELECT
				TO_CHAR(u.created_at, 'YYYY-MM') as cohort_month,
				COUNT(DISTINCT u.id)::int as total_users,
				COUNT(DISTINCT CASE WHEN a.created_at IS NOT NULL THEN u.id END)::int as active_users,
				ROUND(COUNT(DISTINCT CASE WHEN a.created_at IS NOT NULL THEN u.id END) * 100.0 / NULLIF(COUNT(DISTINCT u.id), 0), 2) as retention_rate
			FROM
				"user" u
			LEFT JOIN
				activity a ON u.id = a.user_id AND a.created_at >= NOW() - INTERVAL '30 days'
			WHERE
				u.created_at >= NOW() - INTERVAL '12 months'
			GROUP BY
				cohort_month
			ORDER BY
				cohort_month DESC
		`;
		const result = await db.all(query);
		return result as { cohort_month: string; total_users: number; active_users: number; retention_rate: number }[];
	},
	getUsersWithMembership: async (page: number = 1, limit: number = 10) => {
		const offset = (page - 1) * limit;
		
		const query = sql`
			SELECT 
				u.id,
				u.username,
				u.email,
				u.created_at,
				COALESCE(mt.name, 'free') as membership_type
			FROM "user" u
			LEFT JOIN user_membership um ON u.id = um.user_id 
				AND (um.end_date IS NULL OR um.end_date > NOW())
			LEFT JOIN membership_type mt ON um.membership_type_id = mt.id
			ORDER BY u.created_at DESC
			LIMIT ${limit} OFFSET ${offset}
		`;
		
		const countQuery = sql`SELECT COUNT(*)::int as total FROM "user"`;
		
		const [users, totalResult] = await Promise.all([
			db.all(query),
			db.get<{ total: number }>(countQuery)
		]);
		
		const total = totalResult?.total ?? 0;
		const totalPages = Math.ceil(total / limit);
		
		return {
			users: users as { id: string; username: string; email: string; created_at: Date; membership_type: string }[],
			pagination: {
				currentPage: page,
				totalPages,
				totalItems: total,
				itemsPerPage: limit,
				hasNext: page < totalPages,
				hasPrev: page > 1
			}
		};
	}
};
