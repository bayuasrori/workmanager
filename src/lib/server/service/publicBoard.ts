import { db } from '../db';
import { project, task, task_status, organization, type Project, type Task } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to generate a URL-friendly slug
function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// Helper function to ensure slug is unique
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const existing = await db.query.project.findFirst({
			where: eq(project.slug, slug)
		});

		if (!existing) {
			return slug;
		}

		slug = `${baseSlug}-${counter}`;
		counter++;
	}
}

// Get or create the public organization
async function getPublicOrganization() {
	let publicOrg = await db.query.organization.findFirst({
		where: eq(organization.name, 'Public')
	});

	if (!publicOrg) {
		const id = crypto.randomUUID();
		const result = await db
			.insert(organization)
			.values({
				id,
				name: 'Public',
				ownerId: null
			})
			.returning();
		publicOrg = result[0];
	}

	return publicOrg;
}

export const publicBoardService = {
	getById: async (id: string) => {
		// First get the project
		const projectData = await db.query.project.findFirst({
			where: and(eq(project.id, id), eq(project.isPublic, true))
		});

		if (!projectData) {
			return null;
		}

		// Then get the tasks separately
		const tasks = await db.query.task.findMany({
			where: eq(task.projectId, projectData.id),
			with: { status: true, assignee: true }
		});

		return {
			...projectData,
			tasks
		};
	},

	getBySlug: async (slug: string) => {
		// First get the project
		const projectData = await db.query.project.findFirst({
			where: and(eq(project.slug, slug), eq(project.isPublic, true))
		});

		if (!projectData) {
			return null;
		}

		// Get the tasks
		const tasks = await db.query.task.findMany({
			where: eq(task.projectId, projectData.id),
			with: { status: true, assignee: true }
		});

		// Get the task statuses for this project
		const taskStatuses = await db.query.task_status.findMany({
			where: eq(task_status.projectId, projectData.id),
			orderBy: (task_status, { asc }) => [asc(task_status.order)]
		});

		return {
			...projectData,
			tasks,
			taskStatuses
		};
	},

	getAll: async () => {
		const projects = await db.query.project.findMany({
			where: eq(project.isPublic, true),
			orderBy: (project, { desc }) => [desc(project.id)] // Using id as proxy for creation order
		});

		// Get tasks for each project
		const projectsWithTasks = await Promise.all(
			projects.map(async (project) => {
				const tasks = await db.query.task.findMany({
					where: eq(task.projectId, project.id),
					with: { status: true, assignee: true }
				});
				return {
					...project,
					tasks
				};
			})
		);

		return projectsWithTasks;
	},

	create: async (item: { name: string; description?: string; createdBy?: string }) => {
		const publicOrg = await getPublicOrganization();
		const id = crypto.randomUUID();
		const baseSlug = generateSlug(item.name);
		const slug = await ensureUniqueSlug(baseSlug);

		const result = await db
			.insert(project)
			.values({
				id,
				name: item.name,
				description: item.description || null,
				slug,
				organizationId: publicOrg!.id,
				isPublic: true
			})
			.returning();

		const createdProject = result[0];

		// Create default task statuses for this project
		await db.insert(task_status).values([
			{
				id: crypto.randomUUID(),
				name: 'To Do',
				order: 1,
				projectId: createdProject.id
			},
			{
				id: crypto.randomUUID(),
				name: 'In Progress',
				order: 2,
				projectId: createdProject.id
			},
			{
				id: crypto.randomUUID(),
				name: 'Done',
				order: 3,
				projectId: createdProject.id
			}
		]);

		return createdProject;
	},

	update: async (
		id: string,
		item: Partial<Omit<Project, 'id' | 'organizationId' | 'isPublic'>>
	) => {
		return await db
			.update(project)
			.set(item)
			.where(and(eq(project.id, id), eq(project.isPublic, true)));
	},

	delete: async (id: string) => {
		// First delete all tasks associated with the project
		await db.delete(task).where(eq(task.projectId, id));
		// Then delete the project
		return await db.delete(project).where(and(eq(project.id, id), eq(project.isPublic, true)));
	},

	// Task management for public boards
	addTask: async (
		projectId: string,
		taskData: { name: string; description?: string; statusId?: string }
	) => {
		const id = crypto.randomUUID();

		// Get statuses for the project
		const statuses = await db.query.task_status.findMany({
			where: eq(task_status.projectId, projectId),
			orderBy: (task_status, { asc }) => [asc(task_status.order)]
		});

		if (statuses.length === 0) {
			throw new Error('No task statuses found for this project');
		}

		const statusId = taskData.statusId || statuses[0].id; // Default to first status (To Do)

		const inserted = await db
			.insert(task)
			.values({
				id,
				name: taskData.name,
				description: taskData.description || null,
				projectId,
				statusId,
				assigneeId: null
			})
			.returning();
		return inserted[0];
	},

	updateTask: async (taskId: string, taskData: Partial<Omit<Task, 'id' | 'projectId'>>) => {
		return await db.update(task).set(taskData).where(eq(task.id, taskId));
	},

	deleteTask: async (taskId: string) => {
		return await db.delete(task).where(eq(task.id, taskId));
	},

	deleteTasksByStatus: async (projectId: string, statusId: string) => {
		return await db
			.delete(task)
			.where(and(eq(task.projectId, projectId), eq(task.statusId, statusId)));
	},

	getTasksByProjectId: async (projectId: string) => {
		return await db.query.task.findMany({
			where: eq(task.projectId, projectId),
			with: { status: true, assignee: true }
		});
	},

	getTaskById: async (taskId: string) => {
		return await db.query.task.findFirst({
			where: eq(task.id, taskId),
			with: { status: true, assignee: true }
		});
	},

	updateTaskStatus: async (taskId: string, newStatusId: string) => {
		return await db.update(task).set({ statusId: newStatusId }).where(eq(task.id, taskId));
	}
};
