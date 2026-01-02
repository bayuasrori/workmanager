import { userMembershipRepository } from '../repositories';

export const userMembershipService = {
	getById: async (id: string) => {
		return await userMembershipRepository.getById(id);
	},
	getAll: async () => {
		return await userMembershipRepository.getAll();
	},
	create: async (item: Omit<typeof import('../db/schema').userMembership.$inferInsert, 'id'>) => {
		return await userMembershipRepository.create(item);
	},
	update: async (id: string, item: Partial<Omit<typeof import('../db/schema').userMembership.$inferInsert, 'id'>>) => {
		return await userMembershipRepository.update(id, item);
	},
	delete: async (id: string) => {
		return await userMembershipRepository.delete(id);
	},
	getMembershipDistribution: async () => {
		return await userMembershipRepository.getMembershipDistribution();
	},
	getUpgradeConversions: async () => {
		return await userMembershipRepository.getUpgradeConversions();
	},
	getChurnRisk: async () => {
		return await userMembershipRepository.getChurnRisk();
	}
};