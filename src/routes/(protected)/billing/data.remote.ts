import * as v from 'valibot';
import { command, query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { paymentService } from '$lib/server/service';
import {
	membershipTypeRepository,
	userMembershipRepository,
	userCreditRepository
} from '$lib/server/repositories';
import { getEffectiveLimits } from '$lib/server/service/entitlement';
import { AI_TOPUP_PACKS } from '$lib/server/plans';

/**
 * Lists plans, AI topup packs, the caller's active membership, AI credit usage.
 */
export const getBillingData = query(async () => {
	const { locals } = getRequestEvent();
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const [plans, payments, activeMembership, credit, limits] = await Promise.all([
		membershipTypeRepository.getAll(),
		paymentService.listByUser(user.id, 25),
		userMembershipRepository.getAll(),
		userCreditRepository.getByUserId(user.id),
		getEffectiveLimits(user.id)
	]);

	const mine = activeMembership.find(
		(m) => m.userId === user.id && m.isActive && (!m.endDate || new Date(m.endDate) > new Date())
	);
	return {
		plans,
		topupPacks: AI_TOPUP_PACKS,
		payments,
		activeMembership: mine ?? null,
		ai: credit
			? {
					monthlyUsed: credit.monthlyUsed,
					monthlyAllowance: limits.aiMonthly,
					topupBalance: credit.topupBalance
				}
			: { monthlyUsed: 0, monthlyAllowance: limits.aiMonthly, topupBalance: 0 }
	};
});

/**
 * Buat langganan plan. Price & seat dari plan/input — client cuma pilih plan (+ seat utk Team).
 */
export const createPayment = command(
	v.object({
		membershipTypeId: v.pipe(v.string(), v.nonEmpty('Plan wajib dipilih.')),
		seats: v.optional(v.pipe(v.number(), v.integer(), v.minValue(3))),
		provider: v.optional(v.pipe(v.string(), v.minLength(1)), 'sumopod'),
		paymentMethodTypeCode: v.optional(v.string()),
		successReturnUrl: v.optional(v.string()),
		cancelReturnUrl: v.optional(v.string())
	}),
	async (input) => {
		const { locals, url } = getRequestEvent();
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		// SumoPod reject localhost/http return URLs.
		const origin = (env.PAPANIN_PUBLIC_URL || url.origin).replace(/\/$/, '');
		const { payment, paymentLinkUrl } = await paymentService.createIntent({
			userId: user.id,
			provider: input.provider as Parameters<typeof paymentService.createIntent>[0]['provider'],
			membershipTypeId: input.membershipTypeId,
			seats: input.seats,
			paymentMethodTypeCode: input.paymentMethodTypeCode,
			successReturnUrl: input.successReturnUrl ?? `${origin}/billing/success`,
			cancelReturnUrl: input.cancelReturnUrl ?? `${origin}/billing/cancel`
		});

		return { paymentId: payment.id, invoiceNumber: payment.invoiceNumber, paymentLinkUrl };
	}
);

/** Beli paket topup AI (one-time). */
export const buyAiTopup = command(
	v.object({
		packId: v.pipe(v.string(), v.nonEmpty('Paket wajib dipilih.'))
	}),
	async (input) => {
		const { locals, url } = getRequestEvent();
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const origin = (env.PAPANIN_PUBLIC_URL || url.origin).replace(/\/$/, '');
		const { payment, paymentLinkUrl } = await paymentService.createTopup({
			userId: user.id,
			provider: 'sumopod',
			packId: input.packId,
			successReturnUrl: `${origin}/billing/success`,
			cancelReturnUrl: `${origin}/billing/cancel`
		});

		return { paymentId: payment.id, invoiceNumber: payment.invoiceNumber, paymentLinkUrl };
	}
);
