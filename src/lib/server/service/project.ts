import { db } from '../db';
import { project, projectMember, task, task_status, taskComment, type Project } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const projectService = {
	getById: async (id: string) => {
		const data = await db.select().from(project).where(eq(project.id, id));
		return data[0];
	},
	getAll: async () => {
		return await db.select().from(project);
	},
	getByMemberUserId: async (userId: string) => {
		return await db
			.select({
				id: project.id,
				name: project.name,
				description: project.description,
				slug: project.slug,
				organizationId: project.organizationId,
				isPublic: project.isPublic
			})
			.from(project)
			.innerJoin(projectMember, eq(projectMember.projectId, project.id))
			.where(and(eq(projectMember.userId, userId)));
	},
	create: async (item: Omit<Project, 'id'>, creatorId?: string) => {
		const id = crypto.randomUUID();
		return await db.transaction(async (tx) => {
			const [projectRecord] = await tx
				.insert(project)
				.values({ ...item, id })
				.returning();
			if (creatorId) {
				await tx
					.insert(projectMember)
					.values({ projectId: projectRecord.id, userId: creatorId })
					.onConflictDoNothing();
			}
			return projectRecord;
		});
	},
	update: async (id: string, item: Partial<Omit<Project, 'id'>>) => {
		return await db.update(project).set(item).where(eq(project.id, id));
	},
	delete: async (id: string) => {
		return await db.delete(project).where(eq(project.id, id));
	},
	deleteCascade: async (id: string) => {
		await db.transaction(async (tx) => {
			// Gather task IDs in this project
			const tasks = await tx.select({ id: task.id }).from(task).where(eq(task.projectId, id));
			const taskIds = tasks.map((t) => t.id);
			// Delete task comments first (FK -> task)
			if (taskIds.length > 0) {
				await tx.delete(taskComment).where(inArray(taskComment.taskId, taskIds));
			}
			// Delete tasks (FK -> project, status)
			await tx.delete(task).where(eq(task.projectId, id));
			// Delete statuses (FK -> project)
			await tx.delete(task_status).where(eq(task_status.projectId, id));
			// Delete project memberships (FK -> project)
			await tx.delete(projectMember).where(eq(projectMember.projectId, id));
			// Finally delete the project
			await tx.delete(project).where(eq(project.id, id));
		});
	}
};
