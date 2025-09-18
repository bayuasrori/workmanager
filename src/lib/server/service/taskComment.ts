import { db } from '../db';
import { taskComment, type TaskComment } from '../db/schema';
import { and, eq } from 'drizzle-orm';

export const createTaskComment = async (
	content: string,
	taskId: string,
	userId: string
): Promise<TaskComment> => {
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
	return newComment;
};

export const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
	return await db.query.taskComment.findMany({
		where: eq(taskComment.taskId, taskId)
	});
};

export const deleteTaskComment = async (id: string, userId: string): Promise<void> => {
	await db.delete(taskComment).where(and(eq(taskComment.id, id), eq(taskComment.userId, userId)));
};
