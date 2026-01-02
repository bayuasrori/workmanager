import { projectRepository, taskRepository, taskStatusRepository, organizationRepository } from '../repositories';
import { type Project, type Task } from '../db/schema';

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
		const allProjects = await projectRepository.getAll();
		const existing = allProjects.find(p => p.slug === slug);

		if (!existing) {
			return slug;
		}

		slug = `${baseSlug}-${counter}`;
		counter++;
	}
}

// Get or create the public organization
async function getPublicOrganization() {
	const allOrgs = await organizationRepository.getAll();
	let publicOrg = allOrgs.find(o => o.name === 'Public');

	if (!publicOrg) {
		publicOrg = await organizationRepository.create({
			name: 'Public',
			ownerId: null
		});
	}

	return publicOrg;
}

export const publicBoardService = {
	getById: async (id: string) => {
		// Get the project
		const projectData = await projectRepository.getById(id);

		if (!projectData || !projectData.isPublic) {
			return null;
		}

		// Get the tasks
		const tasks = await taskRepository.getByProjectId(projectData.id);

		return {
			...projectData,
			tasks
		};
	},

	getBySlug: async (slug: string) => {
		// Get the project by checking all projects (since slug is unique)
		const allProjects = await projectRepository.getAll();
		const projectData = allProjects.find(p => p.slug === slug && p.isPublic);

		if (!projectData) {
			return null;
		}

		// Get the tasks
		const tasks = await taskRepository.getByProjectId(projectData.id);

		// Get the task statuses for this project
		const taskStatuses = await taskStatusRepository.getByProjectId(projectData.id);

		return {
			...projectData,
			tasks,
			taskStatuses
		};
	},

	getAll: async () => {
		const projects = await projectRepository.getAll();
		const publicProjects = projects.filter(p => p.isPublic);

		// Get tasks for each project
		const projectsWithTasks = await Promise.all(
			publicProjects.map(async (project) => {
				const tasks = await taskRepository.getByProjectId(project.id);
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
		const baseSlug = generateSlug(item.name);
		const slug = await ensureUniqueSlug(baseSlug);

		const createdProject = await projectRepository.create({
			name: item.name,
			description: item.description || null,
			slug,
			organizationId: publicOrg!.id,
			isPublic: true
		});

		// Create default task statuses for this project
		await taskStatusRepository.create({
			name: 'To Do',
			order: 1,
			projectId: createdProject.id
		});
		await taskStatusRepository.create({
			name: 'In Progress',
			order: 2,
			projectId: createdProject.id
		});
		await taskStatusRepository.create({
			name: 'Done',
			order: 3,
			projectId: createdProject.id
		});

		return createdProject;
	},

	update: async (
		id: string,
		item: Partial<Omit<Project, 'id' | 'organizationId' | 'isPublic'>>
	) => {
		const projectData = await projectRepository.getById(id);
		if (!projectData || !projectData.isPublic) {
			return null;
		}
		return await projectRepository.update(id, item);
	},

	delete: async (id: string) => {
		// First delete all tasks associated with the project
		const tasks = await taskRepository.getByProjectId(id);
		for (const task of tasks) {
			await taskRepository.delete(task.id);
		}
		// Then delete the project
		return await projectRepository.delete(id);
	},

	// Task management for public boards
	addTask: async (
		projectId: string,
		taskData: { name: string; description?: string; statusId?: string }
	) => {
		// Get statuses for the project
		const statuses = await taskStatusRepository.getByProjectId(projectId);

		if (statuses.length === 0) {
			throw new Error('No task statuses found for this project');
		}

		const statusId = taskData.statusId || statuses[0].id; // Default to first status (To Do)

		const inserted = await taskRepository.create({
			name: taskData.name,
			description: taskData.description || null,
			projectId,
			statusId,
			assigneeId: null,
			startDate: null,
			endDate: null
		});
		return inserted[0];
	},

	updateTask: async (taskId: string, taskData: Partial<Omit<Task, 'id' | 'projectId'>>) => {
		const updatedRows = await taskRepository.update(taskId, taskData);
		return updatedRows[0];
	},

	deleteTask: async (taskId: string) => {
		return await taskRepository.delete(taskId);
	},

	deleteTasksByStatus: async (projectId: string, statusId: string) => {
		const tasks = await taskRepository.getByProjectIdAndStatus(projectId, statusId);
		for (const task of tasks) {
			await taskRepository.delete(task.id);
		}
	},

	getTasksByProjectId: async (projectId: string) => {
		return await taskRepository.getByProjectId(projectId);
	},

	getTaskById: async (taskId: string) => {
		return await taskRepository.getById(taskId);
	},

	updateTaskStatus: async (taskId: string, newStatusId: string) => {
		const updatedRows = await taskRepository.update(taskId, { statusId: newStatusId });
		return updatedRows[0];
	}
};