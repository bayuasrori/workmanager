import * as v from 'valibot';
import { command, query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { membershipTypeRepository } from '$lib/server/repositories';
import { requireAdmin } from '../payment-gateways/utils';

export const getMembershipTypes = query(async () => {
	const { locals } = getRequestEvent();
	requireAdmin(locals);
	const types = await membershipTypeRepository.getAll();
	return { types };
});

export const createMembershipType = command(
	v.object({
		id: v.pipe(v.string(), v.nonEmpty('ID wajib (mis. pro).')),
		name: v.pipe(v.string(), v.nonEmpty('Plan wajib.')),
		description: v.optional(v.string()),
		price: v.pipe(v.number(), v.minValue(0)),
		currency: v.optional(v.pipe(v.string(), v.minLength(3), v.maxLength(3)), 'IDR'),
		durationMonths: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
		isDefault: v.optional(v.boolean(), false)
	}),
	async (input) => {
		requireAdmin(getRequestEvent().locals);
		const existing = await membershipTypeRepository.getById(input.id);
		if (existing) throw error(400, `Plan "${input.id}" sudah ada.`);
		const created = await membershipTypeRepository.create({
			id: input.id,
			name: input.name as 'free' | 'pro' | 'team',
			description: input.description ?? null,
			price: String(input.price),
			currency: input.currency,
			durationMonths: input.durationMonths,
			isDefault: input.isDefault
		});
		return { type: created };
	}
);

export const updateMembershipType = command(
	v.object({
		id: v.string(),
		description: v.optional(v.string()),
		price: v.optional(v.number()),
		currency: v.optional(v.string()),
		durationMonths: v.optional(v.number()),
		isDefault: v.optional(v.boolean())
	}),
	async (input) => {
		requireAdmin(getRequestEvent().locals);
		const existing = await membershipTypeRepository.getById(input.id);
		if (!existing) throw error(404, 'Plan tidak ditemukan.');
		const updated = await membershipTypeRepository.update(input.id, {
			description: input.description,
			price: input.price !== undefined ? String(input.price) : undefined,
			currency: input.currency,
			durationMonths: input.durationMonths,
			isDefault: input.isDefault
		});
		return { type: updated };
	}
);

export const deleteMembershipType = command(v.object({ id: v.string() }), async ({ id }) => {
	requireAdmin(getRequestEvent().locals);
	if (id === 'free') throw error(400, 'Plan free tidak boleh dihapus.');
	await membershipTypeRepository.delete(id);
	return { success: true };
});
