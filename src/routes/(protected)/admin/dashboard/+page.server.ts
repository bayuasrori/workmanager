import { userService, organizationService, projectService, activityService, taskStatusService, userMembershipService, taskService, sessionService } from '$lib/server/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 10;

	const users = await userService.getAll();
	const organizations = await organizationService.getAll();
	const projects = await projectService.getAll();
	const userActivity = await activityService.getActivityCountPerUser();
	const projectTaskDistribution = await projectService.getTaskCountPerProject();
	const taskStatusDistribution = await taskStatusService.getTaskCountInStatus();
	const newUsersPerDay = await userService.getNewUsersPerDay();
	const organizationDistribution = await organizationService.getProjectCountPerOrganization();
	
	// Get paginated users with membership
	const paginatedUsers = await userService.getUsersWithMembership(page, limit);
	
	// New engagement charts data
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
		// Paginated users with membership
		paginatedUsers,
		// New engagement data
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
};
