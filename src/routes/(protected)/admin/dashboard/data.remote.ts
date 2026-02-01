import * as v from 'valibot';
import { query, getRequestEvent } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import {
	userService,
	organizationService,
	projectService,
	activityService,
	taskStatusService,
	userMembershipService,
	taskService,
	sessionService
} from '$lib/server/service';

export const getAdminDashboardData = query(
	v.object({
		page: v.optional(v.number())
	}),
	async ({ page }) => {
		const { locals } = getRequestEvent();
		if (!locals.user) {
			throw redirect(302, '/login');
		}
		if (!locals.user.isAdmin) {
			throw error(403, 'Forbidden');
		}
		const currentPage = page ?? 1;
		const limit = 10;

		const users = await userService.getAll();
		const organizations = await organizationService.getAll();
		const projects = await projectService.getAll();
		const userActivity = await activityService.getActivityCountPerUser();
		const projectTaskDistribution = await projectService.getTaskCountPerProject();
		const taskStatusDistribution = await taskStatusService.getTaskCountInStatus();
		const newUsersPerDay = await userService.getNewUsersPerDay();
		const organizationDistribution = await organizationService.getProjectCountPerOrganization();

		const paginatedUsers = await userService.getUsersWithMembership(currentPage, limit);

		const userJourneyFunnel = await userService.getUserJourneyFunnel();
		const userRetentionRate = await userService.getUserRetentionRate();
		const activityHeatmap = await activityService.getActivityHeatmap();
		const realTimeActivityFeed = await activityService.getRealTimeActivityFeed();
		const activityTrends = await activityService.getActivityTrends();
		const membershipDistribution = await userMembershipService.getMembershipDistribution();
		const upgradeConversions = await userMembershipService.getUpgradeConversions();
		const churnRisk = await userMembershipService.getChurnRisk();
		const taskVelocity = await taskService.getTaskVelocity();
		const taskCompletionRate = await taskService.getTaskCompletionRate();
		const taskStatusMetrics = await taskService.getTaskStatusMetrics();
		const sessionDurationTrends = await sessionService.getSessionDurationTrends();
		const userEngagementMetrics = await sessionService.getUserEngagementMetrics();
		const activeSessionsCount = await sessionService.getActiveSessionsCount();

		return {
			users,
			organizations,
			projects,
			userActivity,
			projectTaskDistribution,
			taskStatusDistribution,
			newUsersPerDay,
			organizationDistribution,
			paginatedUsers,
			userJourneyFunnel,
			userRetentionRate,
			activityHeatmap,
			realTimeActivityFeed,
			activityTrends,
			membershipDistribution,
			upgradeConversions,
			churnRisk,
			taskVelocity,
			taskCompletionRate,
			taskStatusMetrics,
			sessionDurationTrends,
			userEngagementMetrics,
			activeSessionsCount
		};
	}
);
