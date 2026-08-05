import { db } from '../db';
import { userMembership } from '../db/schema';
import { and, eq, gt, or, isNull, sql } from 'drizzle-orm';

export const userMembershipRepository = {
	getById: async (id: string) => {
		const data = await db.select().from(userMembership).where(eq(userMembership.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(userMembership);
	},
	/** Semua membership milik satu user (tanpa filter aktif). */
	getByUserId: async (userId: string) => {
		return await db
			.select()
			.from(userMembership)
			.where(eq(userMembership.userId, userId));
	},
	/**
	 * Membership aktif user — query langsung ke DB, tidak `getAll()` + filter.
	 * "Aktif" = isActive true DAN (endDate null ATAU endDate di masa depan).
	 */
	getActiveByUserId: async (userId: string) => {
		const now = new Date();
		const rows = await db
			.select()
			.from(userMembership)
			.where(
				and(
					eq(userMembership.userId, userId),
					eq(userMembership.isActive, true),
					or(isNull(userMembership.endDate), gt(userMembership.endDate, now))
				)
			)
			.limit(1);
		return rows[0] ?? null;
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
	/**
	 * Activates a membership for a user: expires any currently-active rows,
	 * then inserts a fresh one spanning `durationMonths` from now.
	 * Runs in a transaction so the user always has exactly one active plan.
	 */
	activateForUser: async (
		userId: string,
		membershipTypeId: string,
		durationMonths: number,
		seats?: number | null
	) => {
		return await db.transaction(async (tx) => {
			await tx
				.update(userMembership)
				.set({ isActive: false })
				.where(eq(userMembership.userId, userId));
			const [row] = await tx
				.insert(userMembership)
				.values({
					userId,
					membershipTypeId,
					startDate: new Date(),
					endDate: sql`now() + make_interval(months => ${durationMonths})`,
					isActive: true,
					isTrial: false,
					seats: seats ?? null
				})
				.returning();
			return row;
		});
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
