import { db } from '../db';
import { task, taskComment, type TaskComment } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { activityService } from './activity';

export const createTaskComment = async (
	content: string,
	taskId: string,
	userId: string
): Promise<TaskComment> => {
	const taskRecord = await db
		.select({ id: task.id, projectId: task.projectId, name: task.name })
		.from(task)
		.where(eq(task.id, taskId))
		.limit(1);
	const targetTask = taskRecord[0];
	const [newComment] = await db
		.insert(taskComment)
		.values({
			id: crypto.randomUUID(),
			content,
			taskId,
			userId,
			createdAt: new Date()
		})
		.returning();
	if (targetTask?.projectId) {
		await activityService.record({
			projectId: targetTask.projectId,
			userId,
			taskId: targetTask.id,
			type: 'TASK_COMMENT_ADDED',
			description: `Komentar baru pada task "${targetTask.name}"`,
			metadata: { commentId: newComment.id }
		});
	}
	return newComment;
};

export const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
	return await db.query.taskComment.findMany({
		where: eq(taskComment.taskId, taskId)
	});
};

export const deleteTaskComment = async (id: string, userId: string): Promise<void> => {
	const existing = await db.query.taskComment.findFirst({ where: eq(taskComment.id, id) });
	if (!existing || existing.userId !== userId) {
		return;
	}
	await db.delete(taskComment).where(and(eq(taskComment.id, id), eq(taskComment.userId, userId)));
	if (existing.taskId) {
		const taskRecord = await db
			.select({ id: task.id, projectId: task.projectId, name: task.name })
			.from(task)
			.where(eq(task.id, existing.taskId))
			.limit(1);
		const targetTask = taskRecord[0];
		if (targetTask?.projectId) {
			await activityService.record({
				projectId: targetTask.projectId,
				userId,
				taskId: targetTask.id,
				type: 'TASK_COMMENT_DELETED',
				description: `Komentar pada task "${targetTask.name}" dihapus`,
				metadata: { commentId: existing.id }
			});
		}
	}
};
