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
} from '../utils';

function assertGatewayExists(id: string) {
	if (!id) {
		throw error(400, 'Payment gateway id is required.');
	}
}

export const GET: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const { id } = params;

	assertGatewayExists(id);

	const gateway = await paymentGatewayService.getById(id);
	if (!gateway) {
		throw error(404, 'Payment gateway not found.');
	}

	return json({ gateway });
};

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
	requireAdmin(locals);
	const { id } = params;

	assertGatewayExists(id);

	const existing = await paymentGatewayService.getById(id);
	if (!existing) {
		throw error(404, 'Payment gateway not found.');
	}

	const payload = await request.json();
	const { name, provider, status, webhookSecret, metadata, credentials } = payload ?? {};

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
		updateInput.webhookSecret = webhookSecret;
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
		await paymentGatewayService.update(id, updateInput);
	}

	if (credentials !== undefined) {
		if (credentials === null) {
			await paymentGatewayService.updateCredentials(id, {});
		} else {
			const normalizedCredentials = ensureRecord(credentials);
			await paymentGatewayService.updateCredentials(id, normalizedCredentials ?? {});
		}
		hasMutations = true;
	}

	if (status !== undefined) {
		if (!isValidStatus(status)) {
			throw error(400, 'status must be a valid payment gateway status.');
		}
		await paymentGatewayService.setStatus(id, status as PaymentGatewayStatus);
		hasMutations = true;
	}

	if (!hasMutations) {
		throw error(400, 'No valid fields provided for update.');
	}

	const gateway = await paymentGatewayService.getById(id);
	if (!gateway) {
		throw error(404, 'Payment gateway not found.');
	}

	return json({ gateway });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const { id } = params;

	assertGatewayExists(id);

	const existing = await paymentGatewayService.getById(id);
	if (!existing) {
		throw error(404, 'Payment gateway not found.');
	}

	try {
		await paymentGatewayService.delete(id);
	} catch (err) {
		if (err instanceof Error) {
			throw error(400, err.message);
		}
		throw error(500, 'Unable to delete payment gateway.');
	}

	return new Response(null, { status: 204 });
};
