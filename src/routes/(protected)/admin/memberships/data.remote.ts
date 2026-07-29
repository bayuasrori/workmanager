import * as v from 'valibot';
import { command, query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import {
	userRepository,
	userMembershipRepository,
	membershipTypeRepository
} from '$lib/server/repositories';
import { requireAdmin } from '../payment-gateways/utils';

export const getAdminMemberships = query(async () => {
	const { locals } = getRequestEvent();
	requireAdmin(locals);

	const [users, memberships, types] = await Promise.all([
		userRepository.getAll(),
		userMembershipRepository.getAll(),
		membershipTypeRepository.getAll()
	]);

	const now = Date.now();
	const rows = users.map((u) => {
		const active = memberships.find(
			(m) => m.userId === u.id && m.isActive && (!m.endDate || new Date(m.endDate).getTime() > now)
		);
		return {
			id: u.id,
			username: u.username,
			email: u.email,
			isAdmin: u.isAdmin,
			membership: active
				? {
						plan: active.membershipTypeId,
						isTrial: active.isTrial,
						seats: active.seats,
						startDate: active.startDate,
						endDate: active.endDate
					}
				: null
		};
	});

	// Users with active membership first, then the rest.
	rows.sort((a, b) => (a.membership ? -1 : 0) - (b.membership ? -1 : 0));

	return { rows, types };
});

export const grantMembership = command(
	v.object({
		userId: v.pipe(v.string(), v.nonEmpty('User wajib dipilih.')),
		membershipTypeId: v.pipe(v.string(), v.nonEmpty('Plan wajib.')),
		durationMonths: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
		seats: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)))
	}),
	async (input) => {
		requireAdmin(getRequestEvent().locals);

		const user = await userRepository.getById(input.userId);
		if (!user) throw error(404, 'User tidak ditemukan.');

		const plan = await membershipTypeRepository.getById(input.membershipTypeId);
		if (!plan) throw error(404, 'Plan tidak ditemukan.');
		if (Number(plan.price ?? 0) > 0 && plan.id !== 'free' && !input.seats && plan.id === 'team') {
			// team needs seats hint; default to 3.
		}

		await userMembershipRepository.activateForUser(
			input.userId,
			plan.id,
			input.durationMonths,
			input.seats ?? null
		);
		return { success: true };
	}
);

export const revokeMembership = command(
	v.object({ userId: v.pipe(v.string(), v.nonEmpty()) }),
	async ({ userId }) => {
		requireAdmin(getRequestEvent().locals);
		const all = await userMembershipRepository.getAll();
		const active = all.filter((m) => m.userId === userId && m.isActive);
		if (active.length === 0) throw error(404, 'Tidak ada membership aktif.');
		for (const m of active) {
			await userMembershipRepository.update(m.id, { isActive: false });
		}
		return { success: true };
	}
);
