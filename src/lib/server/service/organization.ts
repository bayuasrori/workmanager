import { organizationRepository } from '../repositories';
import { type Organization } from '../db/schema';

export const organizationService = {
	getById: async (id: string) => {
		return await organizationRepository.getById(id);
	},
	isMember: async (organizationId: string, userId: string) => {
		return await organizationRepository.isMember(organizationId, userId);
	},
	getAll: async () => {
		return await organizationRepository.getAll();
	},
	getByMemberUserId: async (userId: string) => {
		return await organizationRepository.getByMemberUserId(userId);
	},
	create: async (item: Omit<Organization, 'id'>) => {
		return await organizationRepository.create(item);
	},
	update: async (id: string, item: Partial<Omit<Organization, 'id'>>) => {
		return await organizationRepository.update(id, item);
	},
	delete: async (id: string) => {
		return await organizationRepository.delete(id);
	},
	getProjectCountPerOrganization: async () => {
		return await organizationRepository.getProjectCountPerOrganization();
	}
};