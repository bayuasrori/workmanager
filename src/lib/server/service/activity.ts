import { activityRepository } from '../repositories';

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

		await activityRepository.create({
			projectId,
			userId,
			taskId: taskId ?? null,
			type,
			description: description ?? null,
			metadata: metadata ?? null
		});
	},
	getByProject: async (projectId: string, limit = 50) => {
		return await activityRepository.getByProject(projectId, limit);
	},
	getByTask: async (taskId: string, limit = 50) => {
		return await activityRepository.getByTask(taskId, limit);
	},
	getRecentForUser: async (userId: string, limit = 10) => {
		return await activityRepository.getRecentForUser(userId, limit);
	},
	getDailyActivity: async (projectId?: string) => {
		if (!projectId) {
			return [];
		}
		return await activityRepository.getDailyActivity(projectId);
	},
	getActivityCountPerUser: async () => {
		return await activityRepository.getActivityCountPerUser();
	},
	getActivityHeatmap: async () => {
		return await activityRepository.getActivityHeatmap();
	},
	getRealTimeActivityFeed: async (limit = 20) => {
		return await activityRepository.getRealTimeActivityFeed(limit);
	},
	getActivityTrends: async () => {
		return await activityRepository.getActivityTrends();
	}
};