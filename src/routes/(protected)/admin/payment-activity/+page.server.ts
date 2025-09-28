import { paymentService } from '$lib/server/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return await paymentService.getDashboardAnalytics({
		monthlyRevenueMonths: 6,
		gatewayPerformanceDays: 30,
		recentPaymentsLimit: 20,
		recentFailuresLimit: 10
	});
};
