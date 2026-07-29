import { error } from '@sveltejs/kit';
import { userMembershipRepository, userCreditRepository, userRepository } from '../repositories';
import { projectService, taskService, organizationMemberService } from './index';
import {
	PLAN_LIMITS,
	TRIAL_AI_MONTHLY,
	TRIAL_DAYS,
	type PlanLimits,
	type PlanName,
	type FeatureKey
} from '$lib/server/plans';

const TEAM_DEFAULT_SEATS = 3;
const MS_PER_DAY = 86_400_000;

/** Mulai trial Pro 14 hari utk user baru. Idempoten: skip kalau udah ada membership aktif. */
export async function startTrial(userId: string) {
	const existing = await getActiveMembership(userId);
	if (existing) return null;
	return await userMembershipRepository.create({
		userId,
		membershipTypeId: 'pro',
		startDate: new Date(),
		endDate: new Date(Date.now() + TRIAL_DAYS * MS_PER_DAY),
		isActive: true,
		isTrial: true,
		seats: 1
	});
}

export interface ResolvedPlan {
	plan: PlanName;
	isTrial: boolean;
	seats: number;
}

async function getActiveMembership(userId: string) {
	const all = await userMembershipRepository.getAll();
	return (
		all.find(
			(m) => m.userId === userId && m.isActive && (!m.endDate || new Date(m.endDate) > new Date())
		) ?? null
	);
}

/** Plan efektif user. Default `free` kalau ga ada membership aktif. */
export async function getPlan(userId: string): Promise<ResolvedPlan> {
	const m = await getActiveMembership(userId);
	if (!m) return { plan: 'free', isTrial: false, seats: 1 };
	const plan = (m.membershipTypeId as PlanName) ?? 'free';
	return {
		plan,
		isTrial: m.isTrial ?? false,
		seats: m.seats ?? (plan === 'team' ? TEAM_DEFAULT_SEATS : 1)
	};
}

/** Batasan efektif (trial override AI quota kecil). */
export async function getEffectiveLimits(
	userId: string
): Promise<PlanLimits & { isTrial: boolean; seats: number }> {
	// Admin bypass semua limit.
	const u = await userRepository.getById(userId);
	if (u?.isAdmin) {
		return { ...PLAN_LIMITS.team, isTrial: false, seats: Number.POSITIVE_INFINITY };
	}
	const { plan, isTrial, seats } = await getPlan(userId);
	const base = PLAN_LIMITS[plan];
	const limits: PlanLimits = {
		...base,
		// Team: max anggota = seats dibeli (atau default).
		maxOrgMembers: base.maxOrgMembers === null ? seats : base.maxOrgMembers,
		// Trial: AI dibatasi, bukan pakai kuota plan asli.
		aiMonthly: isTrial ? TRIAL_AI_MONTHLY : base.aiMonthly
	};
	return { ...limits, isTrial, seats };
}

// ── Resource limit guards ──────────────────────────────────────────────

export async function assertProjectLimit(userId: string) {
	const limits = await getEffectiveLimits(userId);
	const projects = await projectService.getByMemberUserId(userId);
	if (projects.length >= limits.maxProjects) {
		throw error(
			402,
			`Batas project plan ${limits.isTrial ? 'trial' : 'free'} tercapai (${limits.maxProjects}). Upgrade untuk project lebih banyak.`
		);
	}
}

export async function assertTaskLimit(userId: string, projectId: string) {
	const limits = await getEffectiveLimits(userId);
	const tasks = await taskService.getByProjectId(projectId);
	if (tasks.length >= limits.maxTasksPerProject) {
		throw error(
			402,
			`Batas task per project tercapai (${limits.maxTasksPerProject}). Upgrade plan.`
		);
	}
}

export async function assertMemberLimit(inviterId: string, organizationId: string) {
	const limits = await getEffectiveLimits(inviterId);
	const members = await organizationMemberService.getByOrganizationId(organizationId);
	const cap = limits.maxOrgMembers ?? TEAM_DEFAULT_SEATS;
	if (members.length >= cap) {
		throw error(402, `Batas anggota organisasi tercapai (${cap}). Beli seat tambahan di /billing.`);
	}
}

// ── Feature gates ──────────────────────────────────────────────────────

export async function assertFeature(userId: string, feature: FeatureKey) {
	const { plan } = await getPlan(userId);
	if (!PLAN_LIMITS[plan].features[feature]) {
		throw error(403, `Fitur "${feature}" butuh plan berbayar. Lihat /billing.`);
	}
}

// ── AI quota ───────────────────────────────────────────────────────────

export interface AiConsumption {
	source: 'monthly' | 'topup';
	remaining: number;
}

/**
 * Memakai 1 kredit AI. Urutan: kuota bulanan plan → saldo topup.
 * Throw 402 kalau keduanya habis.
 */
export async function consumeAiCredit(userId: string): Promise<AiConsumption> {
	const limits = await getEffectiveLimits(userId);
	if (!limits.features.ai) {
		throw error(403, 'Plan kamu tidak mengizinkan AI. Upgrade di /billing.');
	}

	let row = await userCreditRepository.ensure(userId);
	row = await userCreditRepository.refreshMonthlyIfNeeded(userId, row);

	if (row.monthlyUsed < limits.aiMonthly) {
		const updated = await userCreditRepository.incrementMonthlyUsed(userId);
		return {
			source: 'monthly',
			remaining: Math.max(0, limits.aiMonthly - (updated?.monthlyUsed ?? row.monthlyUsed))
		};
	}
	if (row.topupBalance > 0) {
		const updated = await userCreditRepository.decrementTopup(userId);
		return { source: 'topup', remaining: (updated?.topupBalance ?? row.topupBalance) - 1 };
	}
	throw error(
		402,
		`Kuota AI bulanan habis (${limits.aiMonthly} terpakai). Beli topup di /billing.`
	);
}
