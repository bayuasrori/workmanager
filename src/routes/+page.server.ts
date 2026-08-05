import type { PageServerLoad } from './$types';
import { membershipTypeRepository } from '$lib/server/repositories';
import { PLAN_LIMITS, type PlanName } from '$lib/server/plans';

const PLAN_ORDER: PlanName[] = ['free', 'pro', 'team'];

export type PlanCard = {
	id: string;
	name: PlanName;
	price: number;
	currency: string;
	description: string | null;
	isHighlighted: boolean;
	maxProjects: number;
	maxOrgMembers: number | null;
	aiMonthly: number;
	storageMb: number;
	features: {
		publicBoard: boolean;
		customStatus: boolean;
		aiAutomation: boolean;
		timelineFull: boolean;
		export: boolean;
		customBranding: boolean;
	};
};

export const load: PageServerLoad = async ({ locals }) => {
	let plans: PlanCard[] = [];

	try {
		const rows = await membershipTypeRepository.getAll();

		plans = PLAN_ORDER.flatMap((planName) => {
			const row = rows.find((r) => r.name === planName);
			if (!row) return [];
			const limits = PLAN_LIMITS[planName];
			return [
				{
					id: row.id,
					name: planName,
					price: Number(row.price ?? 0),
					currency: row.currency ?? 'IDR',
					description: row.description ?? null,
					isHighlighted: planName === 'pro',
					maxProjects: limits.maxProjects,
					maxOrgMembers: limits.maxOrgMembers,
					aiMonthly: limits.aiMonthly,
					storageMb: limits.storageMb,
					features: {
						publicBoard: limits.features.publicBoard,
						customStatus: limits.features.customStatus,
						aiAutomation: limits.features.aiAutomation,
						timelineFull: limits.features.timelineFull,
						export: limits.features.export,
						customBranding: limits.features.customBranding
					}
				} satisfies PlanCard
			];
		});
	} catch {
		// DB not reachable or no plans seeded — render page without pricing section
		plans = [];
	}

	if (locals.user) {
		return { user: locals.user, isAuthenticated: true, plans };
	}
	return { user: null, isAuthenticated: false, plans };
};
