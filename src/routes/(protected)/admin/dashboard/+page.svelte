<script lang="ts">
	import type { PageData } from './$types';
	import Chart from '$lib/components/Chart.svelte';

	export let data: PageData;

	let userActivityChartData = {};

	$: {
		if (data.userActivity) {
			const labels = data.userActivity.map((d) => d.username);
			const counts = data.userActivity.map((d) => d.count);
			userActivityChartData = {
				labels: labels,
				datasets: [
					{
						label: 'User Activity',
						data: counts,
						backgroundColor: 'rgba(16, 185, 129, 0.5)',
						borderColor: 'rgba(16, 185, 129, 1)',
						borderWidth: 1
					}
				]
			};
		}
	}

	let projectTaskDistributionChartData = {};

	$: {
		if (data.projectTaskDistribution) {
			const labels = data.projectTaskDistribution.map((d) => d.name);
			const counts = data.projectTaskDistribution.map((d) => d.count);
			projectTaskDistributionChartData = {
				labels: labels,
				datasets: [
					{
						label: 'Tasks per Project',
						data: counts,
						backgroundColor: [
							'rgba(255, 99, 132, 0.5)',
							'rgba(54, 162, 235, 0.5)',
							'rgba(255, 206, 86, 0.5)',
							'rgba(75, 192, 192, 0.5)',
							'rgba(153, 102, 255, 0.5)',
							'rgba(255, 159, 64, 0.5)'
						],
						borderColor: [
							'rgba(255, 99, 132, 1)',
							'rgba(54, 162, 235, 1)',
							'rgba(255, 206, 86, 1)',
							'rgba(75, 192, 192, 1)',
							'rgba(153, 102, 255, 1)',
							'rgba(255, 159, 64, 1)'
						],
						borderWidth: 1
					}
				]
			};
		}
	}

	let taskStatusDistributionChartData = {};

	$: {
		if (data.taskStatusDistribution) {
			const labels = data.taskStatusDistribution.map((d) => d.task_status);
			const counts = data.taskStatusDistribution.map((d) => d.count);
			taskStatusDistributionChartData = {
				labels: labels,
				datasets: [
					{
						label: 'Tasks per Status',
						data: counts,
						backgroundColor: [
							'rgba(255, 99, 132, 0.5)',
							'rgba(54, 162, 235, 0.5)',
							'rgba(255, 206, 86, 0.5)',
							'rgba(75, 192, 192, 0.5)',
							'rgba(153, 102, 255, 0.5)',
							'rgba(255, 159, 64, 0.5)'
						],
						borderColor: [
							'rgba(255, 99, 132, 1)',
							'rgba(54, 162, 235, 1)',
							'rgba(255, 206, 86, 1)',
							'rgba(75, 192, 192, 1)',
							'rgba(153, 102, 255, 1)',
							'rgba(255, 159, 64, 1)'
						],
						borderWidth: 1
					}
				]
			};
		}
	}

	let newUsersPerDayChartData = {};

	$: {
		if (data.newUsersPerDay) {
			const labels = data.newUsersPerDay.map((d) => d.date);
			const counts = data.newUsersPerDay.map((d) => d.count);
			newUsersPerDayChartData = {
				labels: labels,
				datasets: [
					{
						label: 'New Users Per Day',
						data: counts,
						fill: false,
						borderColor: 'rgb(75, 192, 192)',
						tension: 0.1
					}
				]
			};
		}
	}

	let organizationDistributionChartData = {};

	$: {
		if (data.organizationDistribution) {
			const labels = data.organizationDistribution.map((d) => d.name);
			const counts = data.organizationDistribution.map((d) => d.count);
			organizationDistributionChartData = {
				labels: labels,
				datasets: [
					{
						label: 'Projects per Organization',
						data: counts,
						backgroundColor: [
							'rgba(255, 99, 132, 0.5)',
							'rgba(54, 162, 235, 0.5)',
							'rgba(255, 206, 86, 0.5)',
							'rgba(75, 192, 192, 0.5)',
							'rgba(153, 102, 255, 0.5)',
							'rgba(255, 159, 64, 0.5)'
						]
					}
				]
			};
		}
	}

	// New engagement charts data
	let userJourneyFunnelChartData = {};

	$: {
		if (data.userJourneyFunnel) {
			const labels = data.userJourneyFunnel.map((d) => d.stage);
			const counts = data.userJourneyFunnel.map((d) => d.count);
			const percentages = data.userJourneyFunnel.map((d) => d.percentage);
			userJourneyFunnelChartData = {
				labels: labels,
				datasets: [
					{
						label: 'Users',
						data: counts,
						backgroundColor: 'rgba(59, 130, 246, 0.5)',
						borderColor: 'rgba(59, 130, 246, 1)',
						borderWidth: 2
					}
				]
			};
		}
	}

	let membershipDistributionChartData = {};

	$: {
		if (data.membershipDistribution) {
			const labels = data.membershipDistribution.map((d) => d.membership_type.toUpperCase());
			const counts = data.membershipDistribution.map((d) => d.count);
			membershipDistributionChartData = {
				labels: labels,
				datasets: [
					{
						label: 'Membership Distribution',
						data: counts,
						backgroundColor: [
							'rgba(34, 197, 94, 0.5)',
							'rgba(251, 191, 36, 0.5)',
							'rgba(147, 51, 234, 0.5)'
						],
						borderColor: [
							'rgba(34, 197, 94, 1)',
							'rgba(251, 191, 36, 1)',
							'rgba(147, 51, 234, 1)'
						],
						borderWidth: 2
					}
				]
			};
		}
	}

	let taskVelocityChartData = {};

	$: {
		if (data.taskVelocity) {
			const labels = data.taskVelocity.map((d) => d.date);
			const created = data.taskVelocity.map((d) => d.created);
			const completed = data.taskVelocity.map((d) => d.completed);
			taskVelocityChartData = {
				labels: labels,
				datasets: [
					{
						label: 'Tasks Created',
						data: created,
						backgroundColor: 'rgba(16, 185, 129, 0.5)',
						borderColor: 'rgba(16, 185, 129, 1)',
						fill: false,
						tension: 0.1
					},
					{
						label: 'Tasks Completed',
						data: completed,
						backgroundColor: 'rgba(239, 68, 68, 0.5)',
						borderColor: 'rgba(239, 68, 68, 1)',
						fill: false,
						tension: 0.1
					}
				]
			};
		}
	}

	let taskCompletionRateChartData = {};

	$: {
		if (data.taskCompletionRate) {
			const labels = data.taskCompletionRate.map((d) => d.month);
			const rates = data.taskCompletionRate.map((d) => d.completion_rate);
			taskCompletionRateChartData = {
				labels: labels,
				datasets: [
					{
						label: 'Completion Rate %',
						data: rates,
						backgroundColor: 'rgba(168, 85, 247, 0.5)',
						borderColor: 'rgba(168, 85, 247, 1)',
						borderWidth: 2,
						fill: true
					}
				]
			};
		}
	}

	let sessionDurationTrendsChartData = {};

	$: {
		if (data.sessionDurationTrends) {
			const labels = data.sessionDurationTrends.map((d) => d.date);
			const durations = data.sessionDurationTrends.map((d) => d.avg_duration_hours);
			sessionDurationTrendsChartData = {
				labels: labels,
				datasets: [
					{
						label: 'Avg Session Duration (hours)',
						data: durations,
						backgroundColor: 'rgba(245, 158, 11, 0.5)',
						borderColor: 'rgba(245, 158, 11, 1)',
						fill: false,
						tension: 0.4
					}
				]
			};
		}
	}
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-bold">Admin Dashboard</h1>

	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div class="card bg-blue-100 shadow-lg border-l-4 border-blue-500">
			<div class="card-body">
				<h2 class="card-title text-blue-700">Total Users</h2>
				<p class="text-4xl font-bold text-blue-800">{data.users.length}</p>
			</div>
		</div>
		<div class="card bg-green-100 shadow-lg border-l-4 border-green-500">
			<div class="card-body">
				<h2 class="card-title text-green-700">Total Organizations</h2>
				<p class="text-4xl font-bold text-green-800">{data.organizations.length}</p>
			</div>
		</div>
		<div class="card bg-purple-100 shadow-lg border-l-4 border-purple-500">
			<div class="card-body">
				<h2 class="card-title text-purple-700">Total Projects</h2>
				<p class="text-4xl font-bold text-purple-800">{data.projects.length}</p>
			</div>
		</div>
		<div class="card bg-orange-100 shadow-lg border-l-4 border-orange-500">
			<div class="card-body">
				<h2 class="card-title text-orange-700">Active Sessions</h2>
				<p class="text-4xl font-bold text-orange-800">{data.activeSessionsCount?.active_sessions || 0}</p>
			</div>
		</div>
	</div>

	<!-- Engagement Boosting Charts -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
		<div class="card bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-blue-700">🎯 User Journey Funnel</h2>
				<p class="text-sm text-blue-600 mb-4">New user onboarding progression</p>
				<Chart type="bar" data={userJourneyFunnelChartData} options={{ responsive: true, indexAxis: 'y' }} />
			</div>
		</div>
		<div class="card bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-green-700">💎 Membership Distribution</h2>
				<p class="text-sm text-green-600 mb-4">User subscription tiers</p>
				<Chart type="doughnut" data={membershipDistributionChartData} options={{ responsive: true }} />
			</div>
		</div>
		<div class="card bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-purple-700">📈 Task Completion Rate</h2>
				<p class="text-sm text-purple-600 mb-4">Monthly completion trends</p>
				<Chart type="line" data={taskCompletionRateChartData} options={{ responsive: true }} />
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
		<div class="card bg-base-200 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">User Activity</h2>
				<Chart type="bar" data={userActivityChartData} options={{ responsive: true }} />
			</div>
		</div>
		<div class="card bg-base-200 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">Project Task Distribution</h2>
				<Chart type="pie" data={projectTaskDistributionChartData} options={{ responsive: true }} />
			</div>
		</div>
	</div>

	<!-- Performance & Engagement Metrics -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
		<div class="card bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-emerald-700">⚡ Task Velocity</h2>
				<p class="text-sm text-emerald-600 mb-4">Daily task creation vs completion</p>
				<Chart type="line" data={taskVelocityChartData} options={{ responsive: true }} />
			</div>
		</div>
		<div class="card bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-amber-700">⏱️ Session Duration Trends</h2>
				<p class="text-sm text-amber-600 mb-4">Average user session length</p>
				<Chart type="line" data={sessionDurationTrendsChartData} options={{ responsive: true }} />
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
		<div class="card bg-base-200 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">Task Status Distribution</h2>
				<Chart type="doughnut" data={taskStatusDistributionChartData} options={{ responsive: true }} />
			</div>
		</div>
		<div class="card bg-base-200 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">New Users Per Day</h2>
				<Chart type="line" data={newUsersPerDayChartData} options={{ responsive: true }} />
			</div>
		</div>
	</div>

	<!-- Real-time Activity & Risk Management -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
		<div class="card bg-gradient-to-br from-cyan-50 to-cyan-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-cyan-700">🔴 Real-time Activity Feed</h2>
				<p class="text-sm text-cyan-600 mb-4">Recent user activities across all projects</p>
				<div class="space-y-2 max-h-64 overflow-y-auto">
					{#if data.realTimeActivityFeed && data.realTimeActivityFeed.length}
						{#each data.realTimeActivityFeed.slice(0, 10) as activity}
							<div class="flex items-center justify-between p-2 bg-white rounded border border-cyan-200">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">{activity.username}</p>
									<p class="text-xs text-gray-600">{activity.description || activity.type}</p>
									<p class="text-xs text-gray-500">{activity.project_name}</p>
								</div>
								<span class="text-xs text-gray-400">
									{new Date(activity.created_at).toLocaleTimeString()}
								</span>
							</div>
						{/each}
					{:else}
						<p class="text-center text-gray-500 text-sm">No recent activity</p>
					{/if}
				</div>
			</div>
		</div>
		<div class="card bg-gradient-to-br from-red-50 to-red-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-red-700">⚠️ Churn Risk Indicators</h2>
				<p class="text-sm text-red-600 mb-4">Users at risk of churning</p>
				<div class="space-y-2 max-h-64 overflow-y-auto">
					{#if data.churnRisk && data.churnRisk.length}
						{#each data.churnRisk.filter(u => u.risk_level === 'high').slice(0, 5) as user}
							<div class="flex items-center justify-between p-2 bg-white rounded border border-red-200">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">{user.username}</p>
									<p class="text-xs text-gray-600">{user.membership_type || 'free'}</p>
								</div>
								<div class="text-right">
									<span class="inline-block px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">
										{user.risk_level}
									</span>
									<p class="text-xs text-gray-500 mt-1">
										{new Date(user.last_activity_date).toLocaleDateString()}
									</p>
								</div>
							</div>
						{/each}
					{:else}
						<p class="text-center text-gray-500 text-sm">No high-risk users identified</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="card bg-base-200 shadow-lg mt-6">
		<div class="card-body">
			<h2 class="card-title">Organization Distribution</h2>
			<Chart type="polarArea" data={organizationDistributionChartData} options={{ responsive: true }} />
		</div>
	</div>

	<div class="card bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg mt-6">
		<div class="card-body">
			<h2 class="card-title text-slate-700 mb-4">👥 User Management</h2>
			<p class="text-sm text-slate-600 mb-4">Manage users and their membership tiers</p>
			<div class="overflow-x-auto">
				<table class="table w-full">
					<thead>
						<tr class="border-slate-200">
							<th class="text-slate-600 font-semibold">Username</th>
							<th class="text-slate-600 font-semibold">Email</th>
							<th class="text-slate-600 font-semibold">Membership Type</th>
						</tr>
					</thead>
					<tbody>
						{#each data.paginatedUsers.users as user (user.id)}
							<tr class="hover:bg-slate-50 border-slate-100">
								<td class="font-medium text-slate-800">{user.username}</td>
								<td class="text-slate-600">{user.email}</td>
								<td>
									<span class="badge {user.membership_type === 'free' ? 'bg-slate-200 text-slate-700' : user.membership_type === 'pro' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'} border-none">
										{user.membership_type.toUpperCase()}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			
			<!-- Pagination -->
			<div class="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
				<div class="text-sm text-slate-600">
					Showing {((data.paginatedUsers.pagination.currentPage - 1) * data.paginatedUsers.pagination.itemsPerPage) + 1} to 
					{Math.min(data.paginatedUsers.pagination.currentPage * data.paginatedUsers.pagination.itemsPerPage, data.paginatedUsers.pagination.totalItems)} 
					of {data.paginatedUsers.pagination.totalItems} users
				</div>
				<div class="join">
					<a 
						href="?page={data.paginatedUsers.pagination.currentPage - 1}" 
						class="join-item btn btn-sm {!data.paginatedUsers.pagination.hasPrev ? 'btn-disabled' : 'btn-outline'}"
						class:btn-disabled={!data.paginatedUsers.pagination.hasPrev}
					>
						Previous
					</a>
					{#each Array.from({length: data.paginatedUsers.pagination.totalPages}, (_, i) => i + 1) as pageNum}
						{#if pageNum === 1 || pageNum === data.paginatedUsers.pagination.totalPages || (pageNum >= data.paginatedUsers.pagination.currentPage - 1 && pageNum <= data.paginatedUsers.pagination.currentPage + 1)}
							<a 
								href="?page={pageNum}" 
								class="join-item btn btn-sm {pageNum === data.paginatedUsers.pagination.currentPage ? 'btn-primary' : 'btn-outline'}"
							>
								{pageNum}
							</a>
						{:else if pageNum === data.paginatedUsers.pagination.currentPage - 2 || pageNum === data.paginatedUsers.pagination.currentPage + 2}
							<span class="join-item btn btn-sm btn-disabled">...</span>
						{/if}
					{/each}
					<a 
						href="?page={data.paginatedUsers.pagination.currentPage + 1}" 
						class="join-item btn btn-sm {!data.paginatedUsers.pagination.hasNext ? 'btn-disabled' : 'btn-outline'}"
						class:btn-disabled={!data.paginatedUsers.pagination.hasNext}
					>
						Next
					</a>
				</div>
			</div>
		</div>
	</div>

	<div>
		<h2 class="text-xl font-bold mb-2">Organizations</h2>
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead>
					<tr>
						<th>Name</th>
						<th>Owner ID</th>
					</tr>
				</thead>
				<tbody>
					{#each data.organizations as org (org.id)}
						<tr>
							<td>{org.name}</td>
							<td>{org.ownerId}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div>
		<h2 class="text-xl font-bold mb-2">Projects</h2>
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead>
					<tr>
						<th>Name</th>
						<th>Organization ID</th>
					</tr>
				</thead>
				<tbody>
					{#each data.projects as project (project.id)}
						<tr>
							<td>{project.name}</td>
							<td>{project.organizationId}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
