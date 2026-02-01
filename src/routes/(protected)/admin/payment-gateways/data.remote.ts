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
} from './utils';

export const getPaymentGateways = query(
	v.object({
		provider: v.optional(v.string()),
		status: v.optional(v.string()),
		metrics: v.optional(v.string()),
		days: v.optional(v.number())
	}),
	async ({ provider, status, metrics, days }) => {
		const { locals } = getRequestEvent();
		requireAdmin(locals);

		if (metrics === 'performance') {
			if (days !== undefined && (Number.isNaN(days) || days < 1)) {
				throw error(400, 'days must be a positive integer');
			}
			const performance = await paymentGatewayService.getGatewayPerformance(
				days ? { days } : undefined
			);
			return { performance };
		}

		if (provider) {
			if (!isValidProvider(provider)) {
				throw error(400, 'Invalid payment gateway provider.');
			}
			const gateways = await paymentGatewayService.getByProvider(
				provider as PaymentGatewayProvider
			);
			return { gateways };
		}

		if (status) {
			if (!isValidStatus(status)) {
				throw error(400, 'Invalid payment gateway status.');
			}
			if (status === 'active') {
				const gateways = await paymentGatewayService.getActive();
				return { gateways };
			}
			const typedStatus = status as PaymentGatewayStatus;
			const allGateways = await paymentGatewayService.list();
			return { gateways: allGateways.filter((gateway) => gateway.status === typedStatus) };
		}

		const gateways = await paymentGatewayService.list();
		return { gateways };
	}
);

export const createPaymentGateway = command(
	v.object({
		name: v.pipe(v.string(), v.nonEmpty()),
		provider: v.string(),
		status: v.optional(v.string()),
		credentials: v.optional(v.any()),
		webhookSecret: v.optional(v.any()),
		metadata: v.optional(v.any())
	}),
	async ({ name, provider, status, credentials, webhookSecret, metadata }) => {
		const { locals } = getRequestEvent();
		requireAdmin(locals);

		if (!isValidProvider(provider)) {
			throw error(400, 'provider is required and must be valid.');
		}

		let normalizedStatus: PaymentGatewayStatus | undefined;
		if (status !== undefined) {
			if (!isValidStatus(status)) {
				throw error(400, 'status must be a valid payment gateway status.');
			}
			normalizedStatus = status as PaymentGatewayStatus;
		}

		let normalizedCredentials: Record<string, unknown> | undefined;
		if (credentials !== undefined) {
			normalizedCredentials = ensureRecord(credentials);
		}

		let normalizedMetadata: Record<string, unknown> | null | undefined;
		if (metadata !== undefined) {
			if (metadata === null) {
				normalizedMetadata = null;
			} else {
				normalizedMetadata = ensureRecord(metadata, { allowNull: true });
			}
		}

		let normalizedWebhookSecret: string | null | undefined = webhookSecret as
			| string
			| null
			| undefined;
		if (webhookSecret !== undefined) {
			if (webhookSecret === null) {
				normalizedWebhookSecret = null;
			} else if (typeof webhookSecret !== 'string') {
				throw error(400, 'webhookSecret must be a string or null.');
			}
		}

		const gateway = await paymentGatewayService.create({
			name: name.trim(),
			provider: provider as PaymentGatewayProvider,
			status: normalizedStatus,
			credentials: normalizedCredentials,
			webhookSecret: normalizedWebhookSecret,
			metadata: normalizedMetadata
		});

		return { gateway };
	}
);
