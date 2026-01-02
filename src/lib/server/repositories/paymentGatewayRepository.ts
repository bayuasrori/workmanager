import { db } from '../db';
import {
	payment,
	paymentGateway,
	paymentGatewayStatusEnum,
	type PaymentGateway as PaymentGatewayRecord
} from '../db/schema';
import { desc, eq, sql } from 'drizzle-orm';

type PaymentGatewayInsert = typeof paymentGateway.$inferInsert;
type PaymentGatewayStatus = (typeof paymentGatewayStatusEnum.enumValues)[number];

export const paymentGatewayRepository = {
	getById: async (id: string) => {
		const result = await db.select().from(paymentGateway).where(eq(paymentGateway.id, id));
		return result[0] ?? null;
	},
	getByProvider: async (provider: PaymentGatewayRecord['provider']) => {
		return await db
			.select()
			.from(paymentGateway)
			.where(eq(paymentGateway.provider, provider))
			.orderBy(desc(paymentGateway.createdAt));
	},
	getActive: async () => {
		return await db
			.select()
			.from(paymentGateway)
			.where(eq(paymentGateway.status, 'active'))
			.orderBy(desc(paymentGateway.createdAt));
	},
	list: async () => {
		return await db.select().from(paymentGateway).orderBy(desc(paymentGateway.createdAt));
	},
	create: async (input: Omit<PaymentGatewayInsert, 'id' | 'createdAt' | 'updatedAt'> & {
		credentials?: Record<string, unknown>;
		metadata?: Record<string, unknown> | null;
	}) => {
		const now = new Date();
		const payload: PaymentGatewayInsert = {
			...input,
			id: crypto.randomUUID(),
			credentials: input.credentials ?? {},
			metadata: input.metadata ?? null,
			createdAt: now,
			updatedAt: now
		};
		const [record] = await db.insert(paymentGateway).values(payload).returning();
		return record;
	},
	update: async (id: string, input: Partial<Omit<PaymentGatewayInsert, 'id'>>) => {
		const payload: Partial<Omit<PaymentGatewayInsert, 'id'>> = {
			...input,
			updatedAt: new Date()
		};
		const [record] = await db
			.update(paymentGateway)
			.set(payload)
			.where(eq(paymentGateway.id, id))
			.returning();
		return record ?? null;
	},
	updateCredentials: async (id: string, credentials: Record<string, unknown>) => {
		const [record] = await db
			.update(paymentGateway)
			.set({ credentials, updatedAt: new Date() })
			.where(eq(paymentGateway.id, id))
			.returning();
		return record ?? null;
	},
	setStatus: async (id: string, status: PaymentGatewayStatus) => {
		const [record] = await db
			.update(paymentGateway)
			.set({ status, updatedAt: new Date() })
			.where(eq(paymentGateway.id, id))
			.returning();
		return record ?? null;
	},
	delete: async (id: string) => {
		return await db.delete(paymentGateway).where(eq(paymentGateway.id, id));
	},
	hasPayments: async (id: string) => {
		const hasPayments = await db
			.select({ exists: sql`1` })
			.from(payment)
			.where(eq(payment.gatewayId, id))
			.limit(1);
		return hasPayments.length > 0;
	},
	getGatewayPerformance: async (options?: { days?: number }) => {
		const rawDays = options?.days;
		const days = typeof rawDays === 'number' && Number.isFinite(rawDays)
			? Math.max(0, Math.trunc(rawDays))
			: null;
		const joinFilter = days && days > 0
			? sql.raw(` AND p.created_at >= NOW() - INTERVAL '${days} days'`)
			: sql``;

		const query = sql`
			SELECT
				pg.id,
				pg.name,
				pg.provider,
				pg.status,
				COUNT(p.id) FILTER (WHERE p.status = 'succeeded')::int AS successful_payments,
				COUNT(p.id) FILTER (WHERE p.status = 'failed')::int AS failed_payments,
				COUNT(p.id)::int AS total_payments,
				COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END), 0)::text AS total_volume
			FROM payment_gateway pg
			LEFT JOIN payment p ON pg.id = p.gateway_id${joinFilter}
			GROUP BY pg.id
			ORDER BY total_volume::numeric DESC, successful_payments DESC
		`;

		const result = await db.all(query);
		return result as Array<{
			id: string;
			name: string;
			provider: PaymentGatewayRecord['provider'];
			status: PaymentGatewayStatus;
			successful_payments: number;
			failed_payments: number;
			total_payments: number;
			total_volume: string;
		}>;
	}
};
