import { query, getRequestEvent } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { paymentService } from '$lib/server/service';

export const getPaymentActivity = query(async () => {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (!locals.user.isAdmin) {
		throw error(403, 'Forbidden');
	}
	return await paymentService.getDashboardAnalytics({
		monthlyRevenueMonths: 6,
		gatewayPerformanceDays: 30,
		recentPaymentsLimit: 20,
		recentFailuresLimit: 10
	});
});
