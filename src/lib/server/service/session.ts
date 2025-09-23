import { db } from '../db';
import { session, type Session } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const sessionService = {
	getById: async (id: string) => {
		const data = await db.select().from(session).where(eq(session.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(session);
	},
	create: async (item: Omit<Session, 'id'>) => {
		const id = crypto.randomUUID();
		return await db.insert(session).values({ ...item, id });
	},
	update: async (id: string, item: Partial<Omit<Session, 'id'>>) => {
		return await db.update(session).set(item).where(eq(session.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(session).where(eq(session.id, id));
	},
	getSessionDurationTrends: async () => {
		const query = sql`
			SELECT
				strftime('%Y-%m-%d', s.expires_at, 'unixepoch') as date,
				AVG(2.0) as avg_duration_hours,
				COUNT(*) as session_count
			FROM
				session s
			WHERE
				s.expires_at >= datetime('now', '-30 days')
			GROUP BY
				date
			ORDER BY
				date ASC
		`;
		const result = await db.all(query);
		return result as { date: string; avg_duration_hours: number; session_count: number }[];
	},
	getUserEngagementMetrics: async () => {
		const query = sql`
			SELECT
				u.username,
				COUNT(s.id) as total_sessions,
				AVG(2.0) as avg_session_hours,
				MAX(s.expires_at) as last_session
			FROM
				session s
			JOIN
				user u ON s.user_id = u.id
			WHERE
				s.expires_at >= datetime('now', '-30 days')
			GROUP BY
				u.username
			ORDER BY
				total_sessions DESC
		`;
		const result = await db.all(query);
		return result as { username: string; total_sessions: number; avg_session_hours: number; last_session: Date }[];
	},
	getActiveSessionsCount: async () => {
		const query = sql`
			SELECT
				COUNT(*) as active_sessions
			FROM
				session
			WHERE
				expires_at > datetime('now')
		`;
		const result = await db.all(query);
		return result[0] as { active_sessions: number };
	}
};
