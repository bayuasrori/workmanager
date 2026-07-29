import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { paymentService } from '$lib/server/service';
import { membershipTypeRepository } from '$lib/server/repositories';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	const payment = await paymentService.getById(params.id);
	if (!payment) throw error(404, 'Invoice tidak ditemukan.');
	if (payment.userId !== locals.user.id && !locals.user.isAdmin) {
		throw error(403, 'Akses ditolak.');
	}
	const plan = payment.membershipTypeId
		? await membershipTypeRepository.getById(payment.membershipTypeId)
		: null;
	return { payment, plan };
};
