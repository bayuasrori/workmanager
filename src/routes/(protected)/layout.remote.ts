import { query, getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { organizationService, projectService } from '$lib/server/service';
import { getEffectiveLimits, getPlan } from '$lib/server/service/entitlement';
import { userCreditRepository } from '$lib/server/repositories';
import type { Organization } from '$lib/server/db/schema';

const buildOrganizations = async (userId: string) => {
	const memberProjects = await projectService.getByMemberUserId(userId);
	const orgIds = Array.from(
		new Set(
			memberProjects
				.map((project) => project.organizationId)
				.filter((id): id is string => typeof id === 'string' && id.length > 0)
		)
	);
	const allOrgs = await organizationService.getAll();
	const orgMap = new Map(allOrgs.map((organization) => [organization.id, organization]));
	return orgIds
		.map((organizationId) => orgMap.get(organizationId))
		.filter((organization): organization is Organization => {
			if (!organization) return false;
			return organization.name !== 'Public';
		})
		.map((organization) => ({
			id: organization.id,
			name: organization.name,
			projects: memberProjects.filter(
				(project) => project.organizationId === organization.id && !project.isPublic
			)
		}));
};

export const getLayoutData = query(async () => {
	const { locals } = getRequestEvent();
	const user = locals.user;
	if (!user) {
		throw redirect(303, '/login');
	}

	let organizations = [] as Awaited<ReturnType<typeof buildOrganizations>>;
	try {
		organizations = await buildOrganizations(user.id);
	} catch {
		organizations = [];
	}

	let entitlement = null as null | {
		plan: string;
		isTrial: boolean;
		seats: number;
		aiAllowance: number;
		aiRemaining: number;
		topupBalance: number;
	};
	try {
		const [limits, planInfo, credit] = await Promise.all([
			getEffectiveLimits(user.id),
			getPlan(user.id),
			userCreditRepository.getByUserId(user.id)
		]);
		const used = credit?.monthlyUsed ?? 0;
		entitlement = {
			plan: planInfo.plan,
			isTrial: planInfo.isTrial,
			seats: planInfo.seats,
			aiAllowance: limits.aiMonthly,
			aiRemaining: Math.max(0, limits.aiMonthly - used),
			topupBalance: credit?.topupBalance ?? 0
		};
	} catch {
		entitlement = null;
	}

	return { user, organizations, entitlement };
});
