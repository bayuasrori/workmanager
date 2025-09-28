import { db } from '../db';
import { activity, project, projectMember } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export type ActivityType =
	| 'TASK_CREATED'
	| 'TASK_UPDATED'
	| 'TASK_DELETED'
	| 'TASK_STATUS_CREATED'
	| 'TASK_STATUS_UPDATED'
	| 'TASK_STATUS_DELETED'
	| 'TASK_STATUS_REORDERED'
	| 'TASK_STATUS_CHANGED'
	| 'TASK_COMMENT_ADDED'
	| 'TASK_COMMENT_DELETED';

export type ActivityRecordInput = {
	projectId?: string | null;
	userId?: string | null;
	taskId?: string | null;
	type: ActivityType | string;
	description?: string | null;
	metadata?: Record<string, unknown> | null;
};

export const activityService = {
	record: async (input: ActivityRecordInput) => {
		const { projectId, userId, taskId, type, description, metadata } = input;
		if (!projectId || !userId) {
			return;
		}

		await db.insert(activity).values({
			id: crypto.randomUUID(),
			projectId,
			taskId: taskId ?? null,
			userId,
			type,
			description: description ?? null,
			metadata: metadata ? JSON.stringify(metadata) : null,
			createdAt: new Date()
		});
	},
	getByProject: async (projectId: string, limit = 50) => {
		return await db.query.activity.findMany({
			where: eq(activity.projectId, projectId),
			orderBy: (activity, { desc: orderDesc }) => [orderDesc(activity.createdAt)],
			limit
		});
	},
	getByTask: async (taskId: string, limit = 50) => {
		return await db.query.activity.findMany({
			where: eq(activity.taskId, taskId),
			orderBy: (activity, { desc: orderDesc }) => [orderDesc(activity.createdAt)],
			limit
		});
	},
	getRecentForUser: async (userId: string, limit = 10) => {
		return await db
			.select({
				id: activity.id,
				description: activity.description,
				type: activity.type,
				createdAt: activity.createdAt,
				projectId: activity.projectId,
				projectName: project.name
			})
			.from(activity)
			.innerJoin(project, eq(project.id, activity.projectId))
			.innerJoin(projectMember, eq(projectMember.projectId, project.id))
			.where(eq(projectMember.userId, userId))
			.orderBy(desc(activity.createdAt))
			.limit(limit);
	},
	getDailyActivity: async (projectId?: string) => {
		if (!projectId) {
			return [];
		}
		const query = sql`
			SELECT
				DATE(created_at) AS date,
				COUNT(*)::int AS count
			FROM activity
			WHERE project_id = ${projectId}
			GROUP BY DATE(created_at)
			ORDER BY DATE(created_at) ASC
		`;
		const result = await db.all<{ date: string; count: number }>(query);
		return result;
	},
	getActivityCountPerUser: async () => {
		const query = sql`
			SELECT
				u.username,
				COUNT(a.id)::int as count
			FROM
				activity a
			JOIN
				"user" u ON u.id = a.user_id
			GROUP BY
				u.username
			ORDER BY
				count DESC
		`;
		const result = await db.all(query);
		return result as { username: string; count: number }[];
	},
	getActivityHeatmap: async () => {
		const query = sql`
			SELECT
				TO_CHAR(created_at, 'YYYY-MM-DD') as date,
				TO_CHAR(created_at, 'HH24') as hour,
				COUNT(*)::int as count
			FROM
				activity
			WHERE
				created_at >= NOW() - INTERVAL '90 days'
			GROUP BY
				date, hour
			ORDER BY
				date ASC, hour ASC
		`;
		const result = await db.all(query);
		return result as { date: string; hour: string; count: number }[];
	},
	getRealTimeActivityFeed: async (limit = 20) => {
		const query = sql`
			SELECT
				a.id,
				a.type,
				a.description,
				a.created_at,
				u.username,
				p.name as project_name
			FROM
				activity a
			JOIN
				"user" u ON a.user_id = u.id
			JOIN
				project p ON a.project_id = p.id
			ORDER BY
				a.created_at DESC
			LIMIT ${limit}
		`;
		const result = await db.all(query);
		return result as { 
			id: string; 
			type: string; 
			description: string; 
			created_at: Date;
			username: string;
			project_name: string;
		}[];
	},
	getActivityTrends: async () => {
		const query = sql`
			SELECT
				TO_CHAR(created_at, 'YYYY-MM-DD') as date,
				a.type,
				COUNT(*)::int as count
			FROM
				activity a
			WHERE
				created_at >= NOW() - INTERVAL '30 days'
			GROUP BY
				date, a.type
			ORDER BY
				date ASC
		`;
		const result = await db.all(query);
		return result as { date: string; type: string; count: number }[];
	}
};
