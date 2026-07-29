import { paymentRepository } from '../repositories';
import { membershipTypeRepository } from '../repositories';
import { userMembershipRepository } from '../repositories';
import { userCreditRepository } from '../repositories';
import type { Payment as PaymentRecord } from '../db/schema';
import { paymentStatusEnum } from '../db/schema';
import { getActiveProvider } from '$lib/server/payment';
import { AI_TOPUP_PACKS } from '$lib/server/plans';
import type { WebhookEvent, PaymentProviderName } from '$lib/server/payment/types';

const now = () => new Date();

type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

type PaymentDashboardOptions = {
	monthlyRevenueMonths?: number;
	gatewayPerformanceDays?: number;
	recentPaymentsLimit?: number;
	recentFailuresLimit?: number;
	cacheTtlMs?: number;
};

type RevenueSummary = {
	total_revenue: string;
	pending_value: string;
	successful_payments: number;
	failed_payments: number;
	total_payments: number;
};

type PaymentWithGateway = PaymentRecord & {
	gatewayName: string | null;
	gatewayProvider: string | null;
};

type PaymentDashboardData = {
	recentPayments: PaymentWithGateway[];
	revenueSummary: RevenueSummary;
	monthlyRevenue: Array<{ month: string; revenue: string }>;
	statusBreakdown: Array<{ status: PaymentStatus; count: number }>;
	gatewayContribution: Array<{
		name: string | null;
		provider: string | null;
		revenue: string;
		successful_payments: number;
	}>;
	recentFailures: PaymentRecord[];
	gatewayPerformance: Array<{
		id: string;
		name: string | null;
		provider: string;
		status: string;
		successful_payments: number;
		failed_payments: number;
		total_payments: number;
		total_volume: string;
	}>;
	activeGateways: Array<{
		id: string;
		name: string | null;
		provider: string;
		status: string;
		credentials: Record<string, unknown>;
		metadata: Record<string, unknown> | null;
		createdAt: Date;
		updatedAt: Date;
	}>;
};

const analyticsCache = new Map<string, { expiresAt: number; value: PaymentDashboardData }>();

/**
 * Activates/extends the user's membership based on a successful subscription payment.
 * - No-op if payment isn't tied to a plan or the plan no longer exists.
 * - For Team plan, forwards purchased seats to the membership row.
 * - Records the activation id back into the payment's metadata for audit.
 */
async function activateMembershipForPayment(record: PaymentRecord | null) {
	if (!record?.membershipTypeId) return;
	if (record.productType && record.productType !== 'subscription') return;
	const plan = await membershipTypeRepository.getById(record.membershipTypeId);
	if (!plan) return;
	const duration = plan.durationMonths ?? 1;
	const activated = await userMembershipRepository.activateForUser(
		record.userId,
		plan.id,
		duration,
		record.seatsPurchased
	);
	await paymentService.appendMetadata(record.id, {
		membershipActivatedId: activated?.id ?? null,
		membershipActivatedAt: new Date().toISOString(),
		membershipDurationMonths: duration,
		membershipSeats: record.seatsPurchased ?? null
	});
}

/**
 * Grants AI topup credits after a successful topup payment.
 * - No-op if payment isn't a topup or has no credits.
 */
async function grantTopupForPayment(record: PaymentRecord | null) {
	if (!record || record.productType !== 'topup' || !record.creditsPurchased) return;
	// Pastikan row user_credit ada (admin/user baru mungkin belum punya).
	await userCreditRepository.ensure(record.userId);
	await userCreditRepository.addTopup(record.userId, record.creditsPurchased);
	await paymentService.appendMetadata(record.id, {
		creditsGranted: record.creditsPurchased,
		grantedAt: new Date().toISOString()
	});
}

export const paymentService = {
	getById: async (id: string) => {
		return await paymentRepository.getById(id);
	},
	list: async (limit = 50) => {
		return await paymentRepository.list(limit);
	},
	listByUser: async (userId: string, limit = 25) => {
		return await paymentRepository.listByUser(userId, limit);
	},
	listWithGateway: async (limit = 50) => {
		return await paymentRepository.listWithGateway(limit);
	},
	getByIntentId: async (intentId: string) => {
		return await paymentRepository.getByIntentId(intentId);
	},
	getByExternalId: async (externalId: string) => {
		return await paymentRepository.getByExternalId(externalId);
	},
	getDashboardAnalytics: async (
		options: PaymentDashboardOptions = {}
	): Promise<PaymentDashboardData> => {
		const cacheTtlMsRaw = options.cacheTtlMs;
		const cacheTtlMs =
			typeof cacheTtlMsRaw === 'number' && Number.isFinite(cacheTtlMsRaw)
				? Math.max(0, Math.trunc(cacheTtlMsRaw))
				: 30_000;

		const cacheKey = JSON.stringify({
			monthlyRevenueMonths: options.monthlyRevenueMonths,
			gatewayPerformanceDays: options.gatewayPerformanceDays,
			recentPaymentsLimit: options.recentPaymentsLimit,
			recentFailuresLimit: options.recentFailuresLimit
		});
		const nowTs = Date.now();
		const cached = analyticsCache.get(cacheKey);
		if (cached && cached.expiresAt > nowTs) {
			return cached.value;
		}

		const dashboard = await paymentRepository.getDashboardAnalytics(options);

		if (cacheTtlMs > 0) {
			analyticsCache.set(cacheKey, { expiresAt: nowTs + cacheTtlMs, value: dashboard });
		}

		return dashboard;
	},
	create: async (
		input: Omit<
			typeof import('../db/schema').payment.$inferInsert,
			'id' | 'status' | 'createdAt' | 'updatedAt'
		> & { status?: PaymentStatus }
	) => {
		return await paymentRepository.create(input);
	},
	update: async (
		id: string,
		input: Partial<Omit<typeof import('../db/schema').payment.$inferInsert, 'id'>>
	) => {
		return await paymentRepository.update(id, input);
	},
	updateStatus: async (
		id: string,
		status: PaymentStatus,
		options?: { errorCode?: string | null; errorMessage?: string | null }
	) => {
		return await paymentRepository.updateStatus(id, status, options);
	},
	markAsSucceeded: async (id: string, metadata?: Record<string, unknown> | null) => {
		const updates: Partial<Omit<typeof import('../db/schema').payment.$inferInsert, 'id'>> = {
			status: 'succeeded',
			completedAt: now()
		};
		if (metadata !== undefined) {
			updates.metadata = metadata;
		}
		return await paymentService.update(id, updates);
	},
	recordFailure: async (
		id: string,
		error: { code?: string; message?: string; metadata?: Record<string, unknown> | null }
	) => {
		const updates: Partial<Omit<typeof import('../db/schema').payment.$inferInsert, 'id'>> = {
			status: 'failed',
			errorCode: error.code ?? null,
			errorMessage: error.message ?? null
		};
		if (error.metadata !== undefined) {
			updates.metadata = error.metadata;
		}
		return await paymentService.update(id, updates);
	},
	appendMetadata: async (id: string, metadata: Record<string, unknown>) => {
		const existing = await paymentService.getById(id);
		if (!existing) {
			return null;
		}

		const merged = { ...(existing.metadata ?? {}), ...metadata };
		return await paymentService.update(id, { metadata: merged });
	},
	getRevenueSummary: async () => {
		return await paymentRepository.getRevenueSummary();
	},
	getMonthlyRevenue: async (months = 6) => {
		return await paymentRepository.getMonthlyRevenue(months);
	},
	getStatusBreakdown: async () => {
		return await paymentRepository.getStatusBreakdown();
	},
	getGatewayContribution: async () => {
		return await paymentRepository.getGatewayContribution();
	},
	getRecentFailures: async (limit = 10) => {
		return await paymentRepository.getRecentFailures(limit);
	},
	createIntent: async (input: {
		userId: string;
		provider: PaymentProviderName;
		membershipTypeId: string;
		seats?: number;
		description?: string;
		expiresInHours?: number;
		paymentMethodTypeCode?: string;
		successReturnUrl?: string;
		cancelReturnUrl?: string;
	}): Promise<{ payment: PaymentRecord; paymentLinkUrl: string }> => {
		const { provider: providerName, membershipTypeId, ...rest } = input;

		// Resolve the plan — price/currency/duration come from it, never from the client.
		const plan = await membershipTypeRepository.getById(membershipTypeId);
		if (!plan) {
			throw new Error(`Membership type "${membershipTypeId}" tidak ditemukan.`);
		}
		const unitPrice = Number(plan.price ?? 0);
		if (unitPrice <= 0) {
			throw new Error('Plan gratis tidak memerlukan pembayaran.');
		}
		// Team = per-seat billing. Pro = 1 seat. Validate seat count.
		const seats = plan.id === 'team' ? Math.max(3, input.seats ?? 3) : 1;
		const totalAmount = unitPrice * seats;
		const currency = (plan.currency ?? 'IDR').toUpperCase();
		const description =
			rest.description ??
			(plan.id === 'team'
				? `Langganan ${plan.name} (${seats} seat)`
				: `Langganan ${plan.name} (${plan.id})`);

		const active = await getActiveProvider(providerName);
		if (!active) {
			throw new Error(
				`Provider "${providerName}" tidak aktif atau belum diimplementasikan. Konfigurasi gateway di /admin/payment-gateways.`
			);
		}
		const { gateway, provider } = active;

		// 1. Persist pending row first so we own the order_id (= payment.id).
		const invoiceNumber = await paymentRepository.getNextInvoiceNumber();
		const payment = await paymentService.create({
			userId: input.userId,
			gatewayId: gateway.id,
			amount: String(totalAmount),
			currency,
			description,
			status: 'pending',
			externalId: null,
			intentId: null,
			invoiceNumber,
			membershipTypeId: plan.id,
			productType: 'subscription',
			seatsPurchased: seats
		});

		// 2. Ask provider for a payment link. order_id echoes back in the webhook.
		const result = await provider.createPayment({
			orderId: payment.id,
			amount: totalAmount,
			currency,
			expiresInHours: rest.expiresInHours,
			successReturnUrl: rest.successReturnUrl,
			cancelReturnUrl: rest.cancelReturnUrl,
			paymentMethodTypeCode: rest.paymentMethodTypeCode,
			description
		});

		// 3. Store provider's payment id + link metadata.
		const updated = await paymentService.update(payment.id, {
			intentId: result.paymentId,
			metadata: {
				paymentLinkUrl: result.paymentLinkUrl,
				expiresAt: result.expiresAt ?? null,
				fee: result.fee ?? null,
				netAmount: result.netAmount ?? null,
				providerStatus: result.status,
				planName: plan.name,
				planDurationMonths: plan.durationMonths,
				seats
			}
		});

		return { payment: updated ?? payment, paymentLinkUrl: result.paymentLinkUrl };
	},
	createTopup: async (input: {
		userId: string;
		provider: PaymentProviderName;
		packId: string;
		expiresInHours?: number;
		paymentMethodTypeCode?: string;
		successReturnUrl?: string;
		cancelReturnUrl?: string;
	}): Promise<{ payment: PaymentRecord; paymentLinkUrl: string }> => {
		const { provider: providerName, packId, ...rest } = input;
		const pack = AI_TOPUP_PACKS.find((p) => p.id === packId);
		if (!pack) {
			throw new Error(`Paket topup "${packId}" tidak ditemukan.`);
		}

		const active = await getActiveProvider(providerName);
		if (!active) {
			throw new Error(
				`Provider "${providerName}" tidak aktif. Konfigurasi gateway di /admin/payment-gateways.`
			);
		}
		const { gateway, provider } = active;

		const invoiceNumber = await paymentRepository.getNextInvoiceNumber();
		const payment = await paymentService.create({
			userId: input.userId,
			gatewayId: gateway.id,
			amount: String(pack.price),
			currency: pack.currency,
			description: pack.label,
			status: 'pending',
			externalId: null,
			intentId: null,
			invoiceNumber,
			productType: 'topup',
			creditsPurchased: pack.credits
		});

		const result = await provider.createPayment({
			orderId: payment.id,
			amount: pack.price,
			currency: pack.currency,
			expiresInHours: rest.expiresInHours,
			successReturnUrl: rest.successReturnUrl,
			cancelReturnUrl: rest.cancelReturnUrl,
			paymentMethodTypeCode: rest.paymentMethodTypeCode,
			description: pack.label
		});

		const updated = await paymentService.update(payment.id, {
			intentId: result.paymentId,
			metadata: {
				paymentLinkUrl: result.paymentLinkUrl,
				expiresAt: result.expiresAt ?? null,
				fee: result.fee ?? null,
				netAmount: result.netAmount ?? null,
				providerStatus: result.status,
				credits: pack.credits,
				packLabel: pack.label
			}
		});

		return { payment: updated ?? payment, paymentLinkUrl: result.paymentLinkUrl };
	},
	handleWebhookEvent: async (
		provider: { normalizeStatus: (s?: string) => PaymentStatus },
		event: WebhookEvent
	): Promise<{ payment: PaymentRecord | null; skipped: boolean }> => {
		// Prefer order_id (our payment.id), fall back to provider payment_id.
		let payment: PaymentRecord | null = null;
		if (event.orderId) payment = await paymentService.getById(event.orderId);
		if (!payment && event.paymentId) payment = await paymentService.getByIntentId(event.paymentId);
		if (!payment) return { payment: null, skipped: true };

		// Idempotent: terminal statuses are not overwritten.
		if (payment.status === 'succeeded' || payment.status === 'refunded') {
			return { payment, skipped: true };
		}

		const status = provider.normalizeStatus(event.status);
		const meta = {
			lastEventType: event.eventType,
			providerStatus: event.status ?? null,
			paymentMethod: event.paymentMethod ?? null,
			completedAt: event.completedAt ?? null,
			fee: event.fee ?? null,
			netAmount: event.netAmount ?? null,
			raw: event.raw
		};

		if (status === 'succeeded') {
			const ok = await paymentService.markAsSucceeded(payment.id, meta);
			const record = ok ?? payment;
			// Dispatch by product type: subscription → activate membership, topup → grant credits.
			if (record.productType === 'topup') {
				await grantTopupForPayment(record);
			} else {
				await activateMembershipForPayment(record);
			}
			return { payment: record, skipped: false };
		}
		if (status === 'failed') {
			const ok = await paymentService.recordFailure(payment.id, {
				message: `Pembayaran ${event.status ?? 'gagal'} via webhook`,
				metadata: meta
			});
			return { payment: ok ?? payment, skipped: false };
		}
		// pending: just enrich metadata.
		await paymentService.appendMetadata(payment.id, meta);
		return { payment, skipped: false };
	}
};
