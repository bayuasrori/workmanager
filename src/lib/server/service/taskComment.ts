import { taskCommentRepository } from '../repositories';
import { taskRepository } from '../repositories';
import { activityService } from './activity';
import { type TaskComment } from '../db/schema';

export const taskCommentService = {
	create: async (
		content: string,
		taskId: string,
		userId: string
	): Promise<TaskComment> => {
		const taskRecord = await taskRepository.getById(taskId);
		const newComment = await taskCommentRepository.create(content, taskId, userId);
		
		if (taskRecord?.projectId) {
			await activityService.record({
				projectId: taskRecord.projectId,
				userId,
				taskId: taskRecord.id,
				type: 'TASK_COMMENT_ADDED',
				description: `Komentar baru pada task "${taskRecord.name}"`,
				metadata: { commentId: newComment.id }
			});
		}
		
		return newComment;
	},

	getByTaskId: async (taskId: string): Promise<TaskComment[]> => {
		return await taskCommentRepository.getByTaskId(taskId);
	},

	delete: async (id: string, userId: string): Promise<void> => {
		const existing = await taskCommentRepository.getById(id);
		
		if (!existing || existing.userId !== userId) {
			return;
		}

		await taskCommentRepository.delete(id, userId);

		if (existing.taskId) {
			const taskRecord = await taskRepository.getById(existing.taskId);
			if (taskRecord?.projectId) {
				await activityService.record({
					projectId: taskRecord.projectId,
					userId,
					taskId: taskRecord.id,
					type: 'TASK_COMMENT_DELETED',
					description: `Komentar pada task "${taskRecord.name}" dihapus`,
					metadata: { commentId: existing.id }
				});
			}
		}
	}
};

// Export the original function names for backward compatibility
export const createTaskComment = taskCommentService.create;
export const getTaskComments = taskCommentService.getByTaskId;
export const deleteTaskComment = taskCommentService.delete;