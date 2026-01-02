import { db } from '../db';
import { project, projectMember, task, task_status, taskComment, user, type Project } from '../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

export const projectRepository = {
	getById: async (id: string) => {
		const data = await db.select().from(project).where(eq(project.id, id));
		return data[0];
	},
	isMember: async (projectId: string, userId: string) => {
		const member = await db
			.select()
			.from(projectMember)
			.where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));
		return member.length > 0;
	},
	getMembers: async (projectId: string) => {
	return await db
		.select({
			userId: projectMember.userId,
			username: user.username,
			email: user.email
		})
		.from(projectMember)
		.innerJoin(user, eq(user.id, projectMember.userId))
		.where(eq(projectMember.projectId, projectId));
},
addMember: async (projectId: string, userId: string) => {
	const result = await db
		.insert(projectMember)
		.values({ projectId, userId })
		.onConflictDoNothing()
		.returning();
	return result[0];
},
removeMember: async (projectId: string, userId: string) => {
	const result = await db
		.delete(projectMember)
		.where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)))
		.returning();
	return result[0];
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
	create: async (item: Omit<Project, 'id'>) => {
		const id = crypto.randomUUID();
		const inserted = await db
			.insert(project)
			.values({ ...item, id })
			.returning();
		return inserted[0];
	},
	createWithMember: async (item: Omit<Project, 'id'>, creatorId: string) => {
		return await db.transaction(async (tx) => {
			const [projectRecord] = await tx
				.insert(project)
				.values({ ...item, id: crypto.randomUUID() })
				.returning();
			await tx
				.insert(projectMember)
				.values({ projectId: projectRecord.id, userId: creatorId })
				.onConflictDoNothing();
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
	},
	getTaskCountPerProject: async () => {
		const query = sql`
			SELECT
				p.name,
				COUNT(t.id)::int as count
			FROM
				project p
			LEFT JOIN
				task t ON p.id = t.project_id
			GROUP BY
				p.name
			ORDER BY
				count DESC
		`;
		const result = await db.all(query);
		return result as { name: string; count: number }[];
	}
};