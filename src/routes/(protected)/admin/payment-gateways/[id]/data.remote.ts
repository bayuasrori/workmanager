import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { paymentGatewayService } from '$lib/server/service';
import {
	ensureRecord,
	requireAdmin,
	isValidProvider,
	isValidStatus,
	type PaymentGatewayProvider,
	type PaymentGatewayStatus
} from '../utils';

const assertGatewayExists = async (id: string) => {
	if (!id) {
		throw error(400, 'Payment gateway id is required.');
	}
	const gateway = await paymentGatewayService.getById(id);
	if (!gateway) {
		throw error(404, 'Payment gateway not found.');
	}
	return gateway;
};

export const getPaymentGateway = query(
	v.object({
		gatewayId: v.string()
	}),
	async ({ gatewayId }) => {
		const { locals } = getRequestEvent();
		requireAdmin(locals);
		const gateway = await assertGatewayExists(gatewayId);
		return { gateway };
	}
);

export const updatePaymentGateway = command(
	v.object({
		gatewayId: v.string(),
		name: v.optional(v.string()),
		provider: v.optional(v.string()),
		status: v.optional(v.string()),
		webhookSecret: v.optional(v.any()),
		metadata: v.optional(v.any()),
		credentials: v.optional(v.any())
	}),
	async ({ gatewayId, name, provider, status, webhookSecret, metadata, credentials }) => {
		const { locals } = getRequestEvent();
		requireAdmin(locals);

		await assertGatewayExists(gatewayId);

		let hasMutations = false;
		const updateInput: Parameters<typeof paymentGatewayService.update>[1] = {};

		if (name !== undefined) {
			if (typeof name !== 'string' || name.trim() === '') {
				throw error(400, 'name must be a non-empty string.');
			}
			updateInput.name = name.trim();
			hasMutations = true;
		}

		if (provider !== undefined) {
			if (!isValidProvider(provider)) {
				throw error(400, 'provider must be a valid payment gateway provider.');
			}
			updateInput.provider = provider as PaymentGatewayProvider;
			hasMutations = true;
		}

		if (webhookSecret !== undefined) {
			if (webhookSecret !== null && typeof webhookSecret !== 'string') {
				throw error(400, 'webhookSecret must be a string or null.');
			}
			updateInput.webhookSecret = webhookSecret as string | null;
			hasMutations = true;
		}

		if (metadata !== undefined) {
			if (metadata === null) {
				updateInput.metadata = null;
			} else {
				updateInput.metadata = ensureRecord(metadata, { allowNull: true });
			}
			hasMutations = true;
		}

		if (Object.keys(updateInput).length > 0) {
			await paymentGatewayService.update(gatewayId, updateInput);
		}

		if (credentials !== undefined) {
			if (credentials === null) {
				await paymentGatewayService.updateCredentials(gatewayId, {});
			} else {
				const normalizedCredentials = ensureRecord(credentials);
				await paymentGatewayService.updateCredentials(gatewayId, normalizedCredentials ?? {});
			}
			hasMutations = true;
		}

		if (status !== undefined) {
			if (!isValidStatus(status)) {
				throw error(400, 'status must be a valid payment gateway status.');
			}
			await paymentGatewayService.setStatus(gatewayId, status as PaymentGatewayStatus);
			hasMutations = true;
		}

		if (!hasMutations) {
			throw error(400, 'No valid fields provided for update.');
		}

		const gateway = await paymentGatewayService.getById(gatewayId);
		if (!gateway) {
			throw error(404, 'Payment gateway not found.');
		}

		return { gateway };
	}
);

export const deletePaymentGateway = command(
	v.object({
		gatewayId: v.string()
	}),
	async ({ gatewayId }) => {
		const { locals } = getRequestEvent();
		requireAdmin(locals);

		await assertGatewayExists(gatewayId);
		try {
			await paymentGatewayService.delete(gatewayId);
		} catch (err) {
			if (err instanceof Error) {
				throw error(400, err.message);
			}
			throw error(500, 'Unable to delete payment gateway.');
		}
		return { success: true };
	}
);
