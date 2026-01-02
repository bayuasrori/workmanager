import { organizationMemberRepository } from '../repositories';

export const organizationMemberService = {
	get: async (organizationId: string, userId: string) => {
		return await organizationMemberRepository.get(organizationId, userId);
	},
	getByOrganizationId: async (organizationId: string) => {
		return await organizationMemberRepository.getByOrganizationId(organizationId);
	},
	isMember: async (organizationId: string, userId: string) => {
		return await organizationMemberRepository.isMember(organizationId, userId);
	},
	getAll: async () => {
		return await organizationMemberRepository.getAll();
	},
	create: async (item: { organizationId: string; userId: string }) => {
		return await organizationMemberRepository.create(item);
	},
	delete: async (organizationId: string, userId: string) => {
		return await organizationMemberRepository.delete(organizationId, userId);
	}
};