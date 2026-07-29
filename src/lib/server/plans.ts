import type { membershipPlanEnum } from '$lib/server/db/schema';

export type PlanName = (typeof membershipPlanEnum.enumValues)[number];

export type FeatureKey =
	| 'ai'
	| 'aiAutomation'
	| 'publicBoard'
	| 'timelineFull'
	| 'customStatus'
	| 'export'
	| 'integrations'
	| 'customBranding';

export interface PlanLimits {
	maxProjects: number;
	maxTasksPerProject: number;
	/** Anggota per organisasi (null = sesuai seats dibeli). */
	maxOrgMembers: number | null;
	storageMb: number;
	aiMonthly: number;
	activityHistoryDays: number;
	maxIntegrations: number;
	features: Record<FeatureKey, boolean>;
}

/** Batasan AI selama trial (meng-override aiMonthly plan trial). */
export const TRIAL_AI_MONTHLY = 20;
export const TRIAL_DAYS = 14;

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
	free: {
		maxProjects: 3,
		maxTasksPerProject: 100,
		maxOrgMembers: 1,
		storageMb: 100,
		aiMonthly: 5,
		activityHistoryDays: 7,
		maxIntegrations: 0,
		features: {
			ai: true,
			aiAutomation: false,
			publicBoard: true,
			timelineFull: false,
			customStatus: false,
			export: false,
			integrations: false,
			customBranding: false
		}
	},
	pro: {
		maxProjects: Number.POSITIVE_INFINITY,
		maxTasksPerProject: Number.POSITIVE_INFINITY,
		maxOrgMembers: 3,
		storageMb: 5 * 1024,
		aiMonthly: 100,
		activityHistoryDays: Number.POSITIVE_INFINITY,
		maxIntegrations: 2,
		features: {
			ai: true,
			aiAutomation: true,
			publicBoard: true,
			timelineFull: true,
			customStatus: true,
			export: true,
			integrations: true,
			customBranding: false
		}
	},
	team: {
		maxProjects: Number.POSITIVE_INFINITY,
		maxTasksPerProject: Number.POSITIVE_INFINITY,
		maxOrgMembers: null, // sesuai seats dibeli
		storageMb: 50 * 1024,
		aiMonthly: 50,
		activityHistoryDays: Number.POSITIVE_INFINITY,
		maxIntegrations: Number.POSITIVE_INFINITY,
		features: {
			ai: true,
			aiAutomation: true,
			publicBoard: true,
			timelineFull: true,
			customStatus: true,
			export: true,
			integrations: true,
			customBranding: true
		}
	}
};

/** Paket topup AI (one-time purchase, semua plan). */
export interface AiTopupPack {
	id: string;
	credits: number;
	price: number;
	currency: string;
	label: string;
}

export const AI_TOPUP_PACKS: AiTopupPack[] = [
	{ id: 'ai_50', credits: 50, price: 25_000, currency: 'IDR', label: 'Starter — 50 kredit' },
	{ id: 'ai_200', credits: 200, price: 75_000, currency: 'IDR', label: 'Best Value — 200 kredit' },
	{ id: 'ai_500', credits: 500, price: 150_000, currency: 'IDR', label: 'Pro — 500 kredit' }
];
