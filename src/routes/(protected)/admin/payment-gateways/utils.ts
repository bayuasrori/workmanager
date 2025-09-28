import { error } from '@sveltejs/kit';
import { paymentGatewayProviderEnum, paymentGatewayStatusEnum } from '$lib/server/db/schema';

export type PaymentGatewayProvider = (typeof paymentGatewayProviderEnum.enumValues)[number];
export type PaymentGatewayStatus = (typeof paymentGatewayStatusEnum.enumValues)[number];

export function requireAdmin(locals: App.Locals) {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}
	if (!user.isAdmin) {
		throw error(403, 'Forbidden');
	}
	return user;
}

export const providerOptions = new Set<PaymentGatewayProvider>(
	paymentGatewayProviderEnum.enumValues
);
export const statusOptions = new Set<PaymentGatewayStatus>(paymentGatewayStatusEnum.enumValues);

export function isValidProvider(value: unknown): value is PaymentGatewayProvider {
	return typeof value === 'string' && providerOptions.has(value as PaymentGatewayProvider);
}

export function isValidStatus(value: unknown): value is PaymentGatewayStatus {
	return typeof value === 'string' && statusOptions.has(value as PaymentGatewayStatus);
}

export function ensureRecord(value: unknown): Record<string, unknown>;
export function ensureRecord(
	value: unknown,
	options: { allowNull: true }
): Record<string, unknown> | null;
export function ensureRecord(
	value: unknown,
	options: { allowNull?: boolean } = {}
): Record<string, unknown> | null {
	if (value === null) {
		if (options.allowNull) {
			return null;
		}
		throw error(400, 'Value cannot be null.');
	}
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw error(400, 'Value must be an object.');
	}
	return value as Record<string, unknown>;
}
