import { db } from '../db';
import { userMembership, membershipType } from '../db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export const userMembershipService = {
	getById: async (id: string) => {
		const data = await db.select().from(userMembership).where(eq(userMembership.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(userMembership);
	},
	create: async (item: Omit<typeof userMembership.$inferInsert, 'id'>) => {
		const id = crypto.randomUUID();
		return await db.insert(userMembership).values({ ...item, id });
	},
	update: async (id: string, item: Partial<Omit<typeof userMembership.$inferInsert, 'id'>>) => {
		return await db.update(userMembership).set(item).where(eq(userMembership.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(userMembership).where(eq(userMembership.id, id));
	},
	getMembershipDistribution: async () => {
		const query = sql`
			SELECT
				mt.name as membership_type,
				COUNT(um.id)::int as count
			FROM
				membership_type mt
			LEFT JOIN
				user_membership um ON mt.id = um.membership_type_id
			WHERE
				um.end_date IS NULL OR um.end_date > NOW()
			GROUP BY
				mt.name
			ORDER BY
				count DESC
		`;
		const result = await db.all(query);
		return result as { membership_type: string; count: number }[];
	},
	getUpgradeConversions: async () => {
		const query = sql`
			SELECT
				TO_CHAR(um.start_date, 'YYYY-MM') as month,
				mt.name as membership_type,
				COUNT(um.id)::int as conversions
			FROM
				user_membership um
			JOIN
				membership_type mt ON um.membership_type_id = mt.id
			WHERE
				mt.name != 'free'
			GROUP BY
				month, mt.name
			ORDER BY
				month DESC
		`;
		const result = await db.all(query);
		return result as { month: string; membership_type: string; conversions: number }[];
	},
	getChurnRisk: async () => {
		const query = sql`
			SELECT
				u.id,
				u.username,
				u.email,
				mt.name as membership_type,
				COALESCE(last_activity.last_seen, u.created_at) as last_activity_date,
				CASE 
					WHEN COALESCE(last_activity.last_seen, u.created_at) < NOW() - INTERVAL '30 days' THEN 'high'
					WHEN COALESCE(last_activity.last_seen, u.created_at) < NOW() - INTERVAL '14 days' THEN 'medium'
					ELSE 'low'
				END as risk_level
			FROM
				"user" u
			LEFT JOIN
				user_membership um ON u.id = um.user_id
			LEFT JOIN
				membership_type mt ON um.membership_type_id = mt.id
			LEFT JOIN
				(SELECT user_id, MAX(created_at) as last_seen FROM activity GROUP BY user_id) last_activity ON u.id = last_activity.user_id
			WHERE
				(um.end_date IS NULL OR um.end_date > NOW())
			ORDER BY
				last_activity_date ASC
		`;
		const result = await db.all(query);
		return result as { 
			id: string; 
			username: string; 
			email: string; 
			membership_type: string; 
			last_activity_date: Date;
			risk_level: 'high' | 'medium' | 'low';
		}[];
	}
};
