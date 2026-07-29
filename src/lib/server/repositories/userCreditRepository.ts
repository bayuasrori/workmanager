import { db } from '../db';
import { userCredit, type UserCredit } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const userCreditRepository = {
	getByUserId: async (userId: string) => {
		const [row] = await db.select().from(userCredit).where(eq(userCredit.userId, userId));
		return row ?? null;
	},
	/** Ambil atau buat row credit user. */
	ensure: async (userId: string) => {
		const existing = await userCreditRepository.getByUserId(userId);
		if (existing) return existing;
		const [row] = await db
			.insert(userCredit)
			.values({ userId })
			.onConflictDoNothing({ target: userCredit.userId })
			.returning();
		return row ?? (await userCreditRepository.getByUserId(userId))!;
	},
	/**
	 * Reset counter bulanan kalau sudah lewat monthlyResetAt.
	 * Mengembalikan row yang sudah up-to-date.
	 */
	refreshMonthlyIfNeeded: async (userId: string, row: UserCredit) => {
		if (row.monthlyResetAt && new Date(row.monthlyResetAt) > new Date()) return row;
		const [updated] = await db
			.update(userCredit)
			.set({
				monthlyUsed: 0,
				monthlyResetAt: sql`now() + interval '1 month'`,
				updatedAt: new Date()
			})
			.where(eq(userCredit.userId, userId))
			.returning();
		return updated ?? row;
	},
	/** Tambah pemakaian bulanan (1 AI call). */
	incrementMonthlyUsed: async (userId: string) => {
		const [row] = await db
			.update(userCredit)
			.set({ monthlyUsed: sql`${userCredit.monthlyUsed} + 1`, updatedAt: new Date() })
			.where(eq(userCredit.userId, userId))
			.returning();
		return row ?? null;
	},
	/** Kurangi saldo topup (1 kredit). */
	decrementTopup: async (userId: string) => {
		const [row] = await db
			.update(userCredit)
			.set({
				topupBalance: sql`GREATEST(${userCredit.topupBalance} - 1, 0)`,
				updatedAt: new Date()
			})
			.where(eq(userCredit.userId, userId))
			.returning();
		return row ?? null;
	},
	/** Tambah saldo topup setelah pembelian pack. */
	addTopup: async (userId: string, credits: number) => {
		const [row] = await db
			.update(userCredit)
			.set({ topupBalance: sql`${userCredit.topupBalance} + ${credits}`, updatedAt: new Date() })
			.where(eq(userCredit.userId, userId))
			.returning();
		return row ?? null;
	}
};
