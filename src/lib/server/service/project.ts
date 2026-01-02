import { projectRepository } from '../repositories';
import { type Project } from '../db/schema';
import { userService } from './user';
import { taskStatusService } from './taskStatus';

export const projectService = {
	getById: async (id: string) => {
		return await projectRepository.getById(id);
	},
	isMember: async (projectId: string, userId: string) => {
		return await projectRepository.isMember(projectId, userId);
	},
	getMembers: async (projectId: string) => {
		return await projectRepository.getMembers(projectId);
	},
	addMember: async (projectId: string, userId: string) => {
		return await projectRepository.addMember(projectId, userId);
	},
	removeMember: async (projectId: string, userId: string) => {
		return await projectRepository.removeMember(projectId, userId);
	},
	getProjectData: async (projectId: string) => {
		const project = await projectRepository.getById(projectId);
		if (!project) {
			return null;
		}

		const members = await projectRepository.getMembers(projectId);
		const users = await userService.getAll();
		const availableUsers = users.filter((u) => !members.some((pm) => pm.userId === u.id));
		const taskStatuses = await taskStatusService.getByProjectId(projectId);

		return {
			project,
			projectMembers: members,
			availableUsers,
			taskStatuses
		};
	},
	getAll: async () => {
		return await projectRepository.getAll();
	},
	getByMemberUserId: async (userId: string) => {
		return await projectRepository.getByMemberUserId(userId);
	},
	create: async (item: Omit<Project, 'id'>, creatorId?: string) => {
		if (creatorId) {
			return await projectRepository.createWithMember(item, creatorId);
		}
		return await projectRepository.create(item);
	},
	update: async (id: string, item: Partial<Omit<Project, 'id'>>) => {
		return await projectRepository.update(id, item);
	},
	delete: async (id: string) => {
		return await projectRepository.delete(id);
	},
	deleteCascade: async (id: string) => {
		return await projectRepository.deleteCascade(id);
	},
	getTaskCountPerProject: async () => {
		return await projectRepository.getTaskCountPerProject();
	}
};