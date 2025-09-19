import { db } from '../db';
import { activity, project, projectMember } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

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
	}
};
