import { db } from '../db';
import {
	payment,
	paymentGateway,
	paymentStatusEnum,
	type Payment as PaymentRecord,
	type PaymentGateway as PaymentGatewayRecord
} from '../db/schema';
import { desc, eq, sql } from 'drizzle-orm';

const now = () => new Date();

type PaymentInsert = typeof payment.$inferInsert;
type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

type CreatePaymentInput = Omit<PaymentInsert, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
	status?: PaymentStatus;
};

type UpdatePaymentInput = Partial<Omit<PaymentInsert, 'id'>>;

type PaymentWithGateway = PaymentRecord & {
	gatewayName: string | null;
	gatewayProvider: string | null;
};

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
		provider: PaymentGatewayRecord['provider'];
		status: PaymentGatewayRecord['status'];
		successful_payments: number;
		failed_payments: number;
		total_payments: number;
		total_volume: string;
	}>;
	activeGateways: PaymentGatewayRecord[];
};

const createEmptyRevenueSummary = (): RevenueSummary => ({
	total_revenue: '0',
	pending_value: '0',
	successful_payments: 0,
	failed_payments: 0,
	total_payments: 0
});

const analyticsCache = new Map<string, { expiresAt: number; value: PaymentDashboardData }>();

export const paymentService = {
	getById: async (id: string) => {
		const [record] = await db.select().from(payment).where(eq(payment.id, id));
		return record ?? null;
	},
	list: async (limit = 50) => {
		return await db
			.select()
			.from(payment)
			.orderBy(desc(payment.createdAt))
			.limit(limit);
	},
	listByUser: async (userId: string, limit = 25) => {
		return await db
			.select()
			.from(payment)
			.where(eq(payment.userId, userId))
			.orderBy(desc(payment.createdAt))
			.limit(limit);
	},
	listWithGateway: async (limit = 50) => {
		const rows = await db
			.select({
				id: payment.id,
				userId: payment.userId,
				gatewayId: payment.gatewayId,
				amount: payment.amount,
				currency: payment.currency,
				status: payment.status,
				intentId: payment.intentId,
				externalId: payment.externalId,
				description: payment.description,
				metadata: payment.metadata,
				errorCode: payment.errorCode,
				errorMessage: payment.errorMessage,
				createdAt: payment.createdAt,
				updatedAt: payment.updatedAt,
				completedAt: payment.completedAt,
				gatewayName: paymentGateway.name,
				gatewayProvider: paymentGateway.provider
			})
			.from(payment)
			.leftJoin(paymentGateway, eq(payment.gatewayId, paymentGateway.id))
			.orderBy(desc(payment.createdAt))
			.limit(limit);

		return rows as PaymentWithGateway[];
	},
	getDashboardAnalytics: async (
		options: PaymentDashboardOptions = {}
	): Promise<PaymentDashboardData> => {
		const monthlyRevenueMonthsRaw = options.monthlyRevenueMonths;
		const monthlyRevenueMonths =
			typeof monthlyRevenueMonthsRaw === 'number' && Number.isFinite(monthlyRevenueMonthsRaw)
				? Math.max(1, Math.trunc(monthlyRevenueMonthsRaw))
				: 6;
		const monthsBack = monthlyRevenueMonths > 0 ? monthlyRevenueMonths - 1 : 0;

		const gatewayPerformanceDaysRaw = options.gatewayPerformanceDays;
		const gatewayPerformanceDays =
			typeof gatewayPerformanceDaysRaw === 'number' && Number.isFinite(gatewayPerformanceDaysRaw)
				? Math.max(0, Math.trunc(gatewayPerformanceDaysRaw))
				: 30;

		const recentPaymentsLimitRaw = options.recentPaymentsLimit;
		const recentPaymentsLimit =
			typeof recentPaymentsLimitRaw === 'number' && Number.isFinite(recentPaymentsLimitRaw)
				? Math.max(1, Math.trunc(recentPaymentsLimitRaw))
				: 20;

		const recentFailuresLimitRaw = options.recentFailuresLimit;
		const recentFailuresLimit =
			typeof recentFailuresLimitRaw === 'number' && Number.isFinite(recentFailuresLimitRaw)
				? Math.max(1, Math.trunc(recentFailuresLimitRaw))
				: 10;

		const cacheTtlMsRaw = options.cacheTtlMs;
		const cacheTtlMs =
			typeof cacheTtlMsRaw === 'number' && Number.isFinite(cacheTtlMsRaw)
				? Math.max(0, Math.trunc(cacheTtlMsRaw))
				: 30_000;

		const cacheKey = JSON.stringify({
			monthlyRevenueMonths,
			gatewayPerformanceDays,
			recentPaymentsLimit,
			recentFailuresLimit
		});
		const nowTs = Date.now();
		const cached = analyticsCache.get(cacheKey);
		if (cached && cached.expiresAt > nowTs) {
			return cached.value;
		}

		const gatewayWindowFilter =
			gatewayPerformanceDays > 0
				? sql`WHERE created_at >= now() - make_interval(days => ${gatewayPerformanceDays})`
				: sql``;

		const analyticsQuery = sql`
WITH recent_payments AS (
	SELECT
		p.id,
		p.user_id AS "userId",
		p.gateway_id AS "gatewayId",
		p.amount,
		p.currency,
		p.status,
		p.intent_id AS "intentId",
		p.external_id AS "externalId",
		p.description,
		p.metadata,
		p.error_code AS "errorCode",
		p.error_message AS "errorMessage",
		p.created_at AS "createdAt",
		p.updated_at AS "updatedAt",
		p.completed_at AS "completedAt",
		pg.name AS "gatewayName",
		pg.provider AS "gatewayProvider"
	FROM payment p
	LEFT JOIN payment_gateway pg ON pg.id = p.gateway_id
	ORDER BY p.created_at DESC
	LIMIT ${recentPaymentsLimit}
),
recent_failures AS (
	SELECT
		p.id,
		p.user_id AS "userId",
		p.gateway_id AS "gatewayId",
		p.amount,
		p.currency,
		p.status,
		p.intent_id AS "intentId",
		p.external_id AS "externalId",
		p.description,
		p.metadata,
		p.error_code AS "errorCode",
		p.error_message AS "errorMessage",
		p.created_at AS "createdAt",
		p.updated_at AS "updatedAt",
		p.completed_at AS "completedAt"
	FROM payment p
	WHERE p.status = 'failed'
	ORDER BY p.updated_at DESC
	LIMIT ${recentFailuresLimit}
),
payment_recent AS (
	SELECT *
	FROM payment
	WHERE created_at >= date_trunc('month', now()) - make_interval(months => ${monthsBack})
),
gateway_window AS (
	SELECT *
	FROM payment
	${gatewayWindowFilter}
),
gateway_contribution AS (
	SELECT
		pg.name,
		pg.provider,
		COALESCE(SUM(CASE WHEN pr.status = 'succeeded' THEN pr.amount ELSE 0 END), 0) AS revenue_numeric,
		COUNT(pr.id) FILTER (WHERE pr.status = 'succeeded')::int AS successful_payments
	FROM payment_gateway pg
	LEFT JOIN payment_recent pr ON pg.id = pr.gateway_id
	GROUP BY pg.id
),
gateway_performance_raw AS (
	SELECT
		pg.id,
		pg.name,
		pg.provider,
		pg.status,
		COUNT(gw.id) FILTER (WHERE gw.status = 'succeeded')::int AS successful_payments,
		COUNT(gw.id) FILTER (WHERE gw.status = 'failed')::int AS failed_payments,
		COUNT(gw.id)::int AS total_payments,
		COALESCE(SUM(CASE WHEN gw.status = 'succeeded' THEN gw.amount ELSE 0 END), 0) AS total_volume_numeric
	FROM payment_gateway pg
	LEFT JOIN gateway_window gw ON pg.id = gw.gateway_id
	GROUP BY pg.id
)
SELECT
	(SELECT COALESCE(json_agg(rp), '[]'::json) FROM recent_payments rp) AS recent_payments,
	(SELECT COALESCE(json_agg(rf), '[]'::json) FROM recent_failures rf) AS recent_failures,
	(SELECT json_build_object(
		'total_revenue', COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0)::text,
		'pending_value', COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::text,
		'successful_payments', COUNT(*) FILTER (WHERE status = 'succeeded')::int,
		'failed_payments', COUNT(*) FILTER (WHERE status = 'failed')::int,
		'total_payments', COUNT(*)::int
	) FROM payment) AS revenue_summary,
	(SELECT COALESCE(json_agg(monthly ORDER BY month), '[]'::json) FROM (
		SELECT
			date_trunc('month', created_at)::date AS month,
			COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0)::text AS revenue
		FROM payment_recent
		GROUP BY month
		ORDER BY month ASC
	) monthly) AS monthly_revenue,
	(SELECT COALESCE(json_agg(status_row), '[]'::json) FROM (
		SELECT status, COUNT(*)::int AS count
		FROM payment_recent
		GROUP BY status
	) status_row) AS status_breakdown,
	(SELECT COALESCE(json_agg(json_build_object(
		'name', name,
		'provider', provider,
		'revenue', revenue_numeric::text,
		'successful_payments', successful_payments
	) ORDER BY revenue_numeric DESC), '[]'::json) FROM gateway_contribution) AS gateway_contribution,
	(SELECT COALESCE(json_agg(json_build_object(
		'id', id,
		'name', name,
		'provider', provider,
		'status', status,
		'successful_payments', successful_payments,
		'failed_payments', failed_payments,
		'total_payments', total_payments,
		'total_volume', total_volume_numeric::text
	) ORDER BY total_volume_numeric DESC, successful_payments DESC), '[]'::json) FROM gateway_performance_raw) AS gateway_performance,
	(SELECT COALESCE(json_agg(active), '[]'::json) FROM (
		SELECT
			id,
			name,
			provider,
			status,
			credentials,
			metadata,
			created_at AS "createdAt",
			updated_at AS "updatedAt"
		FROM payment_gateway
		WHERE status = 'active'
		ORDER BY created_at DESC
	) active) AS active_gateways;
`;

		const analytics = await db.get<{
			recent_payments: PaymentWithGateway[] | null;
			recent_failures: PaymentRecord[] | null;
			revenue_summary: RevenueSummary | null;
			monthly_revenue: Array<{ month: string; revenue: string }> | null;
			status_breakdown: Array<{ status: PaymentStatus; count: number }> | null;
			gateway_contribution: Array<{
				name: string | null;
				provider: string | null;
				revenue: string;
				successful_payments: number;
			}> | null;
			gateway_performance: Array<{
				id: string;
				name: string | null;
				provider: PaymentGatewayRecord['provider'];
				status: PaymentGatewayRecord['status'];
				successful_payments: number;
				failed_payments: number;
				total_payments: number;
				total_volume: string;
			}> | null;
			active_gateways: PaymentGatewayRecord[] | null;
		}>(analyticsQuery);

		const dashboard: PaymentDashboardData = {
			recentPayments: analytics?.recent_payments ?? [],
			revenueSummary: analytics?.revenue_summary ?? createEmptyRevenueSummary(),
			monthlyRevenue: analytics?.monthly_revenue ?? [],
			statusBreakdown: analytics?.status_breakdown ?? [],
			gatewayContribution: analytics?.gateway_contribution ?? [],
			recentFailures: analytics?.recent_failures ?? [],
			gatewayPerformance: analytics?.gateway_performance ?? [],
			activeGateways: analytics?.active_gateways ?? []
		};

		if (cacheTtlMs > 0) {
			analyticsCache.set(cacheKey, { expiresAt: nowTs + cacheTtlMs, value: dashboard });
		}

		return dashboard;
	},
	create: async (input: CreatePaymentInput) => {
		const timestamp = now();
		const payload: PaymentInsert = {
			...input,
			id: crypto.randomUUID(),
			status: input.status ?? 'pending',
			metadata: input.metadata ?? null,
			createdAt: timestamp,
			updatedAt: timestamp
		};
		const [record] = await db.insert(payment).values(payload).returning();
		return record;
	},
	update: async (id: string, input: UpdatePaymentInput) => {
		const payload: UpdatePaymentInput = {
			...input,
			updatedAt: now()
		};
		const [record] = await db
			.update(payment)
			.set(payload)
			.where(eq(payment.id, id))
			.returning();
		return record ?? null;
	},
	updateStatus: async (
		id: string,
		status: PaymentStatus,
		options?: { errorCode?: string | null; errorMessage?: string | null }
	) => {
		const updates: UpdatePaymentInput = {
			status,
			errorCode: options?.errorCode ?? null,
			errorMessage: options?.errorMessage ?? null,
			updatedAt: now()
		};

		if (status === 'succeeded') {
			updates.completedAt = now();
		}

		const [record] = await db
			.update(payment)
			.set(updates)
			.where(eq(payment.id, id))
			.returning();
		return record ?? null;
	},
	markAsSucceeded: async (id: string, metadata?: Record<string, unknown> | null) => {
		const updates: UpdatePaymentInput = {
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
		const updates: UpdatePaymentInput = {
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
		const query = sql`
			SELECT
				COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0)::text AS total_revenue,
				COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::text AS pending_value,
				COUNT(*) FILTER (WHERE status = 'succeeded')::int AS successful_payments,
				COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_payments,
				COUNT(*)::int AS total_payments
			FROM payment
		`;

		const result = await db.get(query);
		return result as {
			total_revenue: string;
			pending_value: string;
			successful_payments: number;
			failed_payments: number;
			total_payments: number;
		};
	},
	getMonthlyRevenue: async (months = 6) => {
		const query = sql`
			SELECT
				date_trunc('month', created_at)::date AS month,
				COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0)::text AS revenue
			FROM payment
			WHERE created_at >= date_trunc('month', now()) - INTERVAL '${months - 1} months'
			GROUP BY month
			ORDER BY month ASC
		`;

		const result = await db.all(query);
		return result as Array<{ month: string; revenue: string }>;
	},
	getStatusBreakdown: async () => {
		const query = sql`
			SELECT status, COUNT(*)::int AS count
			FROM payment
			GROUP BY status
		`;
		const result = await db.all(query);
		return result as Array<{ status: PaymentStatus; count: number }>;
	},
	getGatewayContribution: async () => {
		const query = sql`
			SELECT
				pg.name,
				pg.provider,
				COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END), 0)::text AS revenue,
				COUNT(p.id) FILTER (WHERE p.status = 'succeeded')::int AS successful_payments
			FROM payment p
			LEFT JOIN payment_gateway pg ON pg.id = p.gateway_id
			GROUP BY pg.name, pg.provider
			ORDER BY revenue::numeric DESC
		`;
		const result = await db.all(query);
		return result as Array<{
			name: string | null;
			provider: string | null;
			revenue: string;
			successful_payments: number;
		}>;
	},
	getRecentFailures: async (limit = 10) => {
		return await db
			.select()
			.from(payment)
			.where(eq(payment.status, 'failed'))
			.orderBy(desc(payment.updatedAt))
			.limit(limit);
	}
};
