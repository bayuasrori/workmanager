import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { paymentGatewayService } from '$lib/server/service';
import {
	ensureRecord,
	requireAdmin,
	isValidProvider,
	isValidStatus,
	type PaymentGatewayProvider,
	type PaymentGatewayStatus
} from './utils';

export const GET: RequestHandler = async ({ locals, url }) => {
	requireAdmin(locals);

	const provider = url.searchParams.get('provider');
	const status = url.searchParams.get('status');
	const metrics = url.searchParams.get('metrics');

	if (metrics === 'performance') {
		const daysParam = url.searchParams.get('days');
		const days = daysParam ? Number.parseInt(daysParam, 10) : undefined;
		if (days !== undefined && (Number.isNaN(days) || days < 1)) {
			throw error(400, 'days must be a positive integer');
		}

		const performance = await paymentGatewayService.getGatewayPerformance(
			days ? { days } : undefined
		);
		return json({ performance });
	}

	if (provider) {
		if (!isValidProvider(provider)) {
			throw error(400, 'Invalid payment gateway provider.');
		}
		const gateways = await paymentGatewayService.getByProvider(
			provider as PaymentGatewayProvider
		);
		return json({ gateways });
	}

	if (status) {
		if (!isValidStatus(status)) {
			throw error(400, 'Invalid payment gateway status.');
		}
		if (status === 'active') {
			const gateways = await paymentGatewayService.getActive();
			return json({ gateways });
		}
		const typedStatus = status as PaymentGatewayStatus;
		const allGateways = await paymentGatewayService.list();
		return json({ gateways: allGateways.filter((gateway) => gateway.status === typedStatus) });
	}

	const gateways = await paymentGatewayService.list();
	return json({ gateways });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	requireAdmin(locals);

	const payload = await request.json();

	const { name, provider, status, credentials, webhookSecret, metadata } = payload ?? {};

	if (typeof name !== 'string' || name.trim() === '') {
		throw error(400, 'name is required.');
	}
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

	let normalizedWebhookSecret: string | null | undefined = webhookSecret;
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

	return json({ gateway }, { status: 201 });
};
