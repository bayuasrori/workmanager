import { query, command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { paymentService } from '$lib/server/service';
import { requireAdmin } from '../payment-gateways/utils';

export const getAdminPayments = query(async () => {
	const { locals } = getRequestEvent();
	requireAdmin(locals);
	const payments = await paymentService.listWithGateway(100);
	return { payments };
});

export const refundPayment = command(v.object({ paymentId: v.string() }), async ({ paymentId }) => {
	const { locals } = getRequestEvent();
	requireAdmin(locals);
	const payment = await paymentService.getById(paymentId);
	if (!payment) throw error(404, 'Pembayaran tidak ditemukan.');
	if (payment.status !== 'succeeded') {
		throw error(400, 'Hanya pembayaran succeeded yang bisa direfund.');
	}
	await paymentService.updateStatus(paymentId, 'refunded');
	return { success: true };
});
