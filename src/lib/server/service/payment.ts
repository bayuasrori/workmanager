import { paymentRepository } from '../repositories';
import type { Payment as PaymentRecord } from '../db/schema';
import { paymentStatusEnum } from '../db/schema';

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

type PaymentDashboardData = {
	recentPayments: PaymentRecord[];
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
	getDashboardAnalytics: async (options: PaymentDashboardOptions = {}): Promise<PaymentDashboardData> => {
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
	create: async (input: Omit<typeof import('../db/schema').payment.$inferInsert, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { status?: PaymentStatus }) => {
		return await paymentRepository.create(input);
	},
	update: async (id: string, input: Partial<Omit<typeof import('../db/schema').payment.$inferInsert, 'id'>>) => {
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
	}
};