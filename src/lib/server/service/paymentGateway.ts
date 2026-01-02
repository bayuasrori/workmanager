import { paymentGatewayRepository } from '../repositories';
import type { PaymentGateway as PaymentGatewayRecord } from '../db/schema';
import { paymentGatewayStatusEnum } from '../db/schema';

type PaymentGatewayStatus = (typeof paymentGatewayStatusEnum.enumValues)[number];

export const paymentGatewayService = {
	getById: async (id: string) => {
		return await paymentGatewayRepository.getById(id);
	},
	getByProvider: async (provider: PaymentGatewayRecord['provider']) => {
		return await paymentGatewayRepository.getByProvider(provider);
	},
	getActive: async () => {
		return await paymentGatewayRepository.getActive();
	},
	list: async () => {
		return await paymentGatewayRepository.list();
	},
	create: async (input: Omit<typeof import('../db/schema').paymentGateway.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> & {
		credentials?: Record<string, unknown>;
		metadata?: Record<string, unknown> | null;
	}) => {
		return await paymentGatewayRepository.create(input);
	},
	update: async (id: string, input: Partial<Omit<typeof import('../db/schema').paymentGateway.$inferInsert, 'id'>>) => {
		return await paymentGatewayRepository.update(id, input);
	},
	updateCredentials: async (id: string, credentials: Record<string, unknown>) => {
		return await paymentGatewayRepository.updateCredentials(id, credentials);
	},
	setStatus: async (id: string, status: PaymentGatewayStatus) => {
		return await paymentGatewayRepository.setStatus(id, status);
	},
	delete: async (id: string) => {
		const hasPayments = await paymentGatewayRepository.hasPayments(id);
		
		if (hasPayments) {
			throw new Error('Gateway has payments associated and cannot be deleted.');
		}
		
		return await paymentGatewayRepository.delete(id);
	},
	getGatewayPerformance: async (options?: { days?: number }) => {
		return await paymentGatewayRepository.getGatewayPerformance(options);
	}
};