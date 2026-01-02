import { sessionRepository } from '../repositories';
import { type Session } from '../db/schema';

export const sessionService = {
	getById: async (id: string) => {
		return await sessionRepository.getById(id);
	},
	getAll: async () => {
		return await sessionRepository.getAll();
	},
	create: async (item: Omit<Session, 'id'>) => {
		return await sessionRepository.create(item);
	},
	update: async (id: string, item: Partial<Omit<Session, 'id'>>) => {
		return await sessionRepository.update(id, item);
	},
	delete: async (id: string) => {
		return await sessionRepository.delete(id);
	},
	getSessionDurationTrends: async () => {
		return await sessionRepository.getSessionDurationTrends();
	},
	getUserEngagementMetrics: async () => {
		return await sessionRepository.getUserEngagementMetrics();
	},
	getActiveSessionsCount: async () => {
		return await sessionRepository.getActiveSessionsCount();
	}
};