import { userRepository } from '../repositories';
import { type User } from '../db/schema';

export const userService = {
	getById: async (id: string) => {
		return await userRepository.getById(id);
	},
	getAll: async () => {
		return await userRepository.getAll();
	},
	getUsersNotInOrganization: async (organizationId: string) => {
		return await userRepository.getUsersNotInOrganization(organizationId);
	},
	create: async (item: Omit<User, 'id' | 'createdAt'>) => {
		return await userRepository.create(item);
	},
	update: async (id: string, item: Partial<Omit<User, 'id'>>) => {
		return await userRepository.update(id, item);
	},
	delete: async (id: string) => {
		return await userRepository.delete(id);
	},
	getNewUsersPerDay: async () => {
		return await userRepository.getNewUsersPerDay();
	},
	getUserJourneyFunnel: async () => {
		return await userRepository.getUserJourneyFunnel();
	},
	getUserRetentionRate: async () => {
		return await userRepository.getUserRetentionRate();
	},
	getUsersWithMembership: async (page: number = 1, limit: number = 10) => {
		return await userRepository.getUsersWithMembership(page, limit);
	}
};