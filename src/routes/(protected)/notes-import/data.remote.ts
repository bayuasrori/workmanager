import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import {
	projectService,
	taskStatusService,
	taskService,
	consumeAiCredit
} from '$lib/server/service';
import { getEffectiveLimits } from '$lib/server/service/entitlement';
import { userCreditRepository } from '$lib/server/repositories';
import {
	parseNotesToTasks,
	resolveTaskFields,
	taskDraftSchema
} from '$lib/server/service/noteParser';

async function ensureMembership(projectId: string, userId: string) {
	const ok = await projectService.isMember(projectId, userId);
	if (!ok) error(403, 'Anda bukan anggota proyek ini');
}

async function loadProjectContext(projectId: string) {
	const [statuses, members] = await Promise.all([
		taskStatusService.getByProjectId(projectId),
		projectService.getMembers(projectId)
	]);
	return {
		statuses: statuses.map((s) => ({ id: s.id, name: s.name })),
		members: members.map((m) => ({ id: m.userId, username: m.username }))
	};
}

export const getNotesImportData = query(
	v.object({ projectId: v.optional(v.string()) }),
	async ({ projectId }) => {
		const { locals } = getRequestEvent();
		const userId = locals.user?.id;
		if (!userId) error(401, 'Unauthorized');

		const memberProjects = (await projectService.getByMemberUserId(userId)).filter(
			(p) => !p.isPublic
		);
		const projects = memberProjects.map((p) => ({ id: p.id, name: p.name }));

		let statuses: { id: string; name: string }[] = [];
		let members: { id: string; username: string }[] = [];
		if (projectId && projects.some((p) => p.id === projectId)) {
			const ctx = await loadProjectContext(projectId);
			statuses = ctx.statuses;
			members = ctx.members;
		}

		let aiRemaining = 0;
		const limits = await getEffectiveLimits(userId);
		if (limits.features.ai) {
			const credit = await userCreditRepository.getByUserId(userId);
			const monthlyUsed = credit?.monthlyUsed ?? 0;
			const topupBalance = credit?.topupBalance ?? 0;
			aiRemaining = Math.max(0, limits.aiMonthly - monthlyUsed) + topupBalance;
		}

		return { projects, statuses, members, aiRemaining, hasAiFeature: limits.features.ai };
	}
);

export const parseNotes = command(
	v.object({
		projectId: v.pipe(v.string(), v.nonEmpty('Project wajib dipilih')),
		notes: v.pipe(v.string(), v.nonEmpty('Catatan tidak boleh kosong'))
	}),
	async ({ projectId, notes }) => {
		const { locals } = getRequestEvent();
		const userId = locals.user?.id;
		if (!userId) error(401, 'Unauthorized');
		await ensureMembership(projectId, userId);
		await consumeAiCredit(userId);
		const ctx = await loadProjectContext(projectId);
		return parseNotesToTasks(notes, ctx);
	}
);

export const createTasksFromDrafts = command(
	v.object({
		projectId: v.pipe(v.string(), v.nonEmpty('Project wajib dipilih')),
		drafts: v.array(taskDraftSchema)
	}),
	async ({ projectId, drafts }) => {
		const { locals } = getRequestEvent();
		const userId = locals.user?.id;
		if (!userId) error(401, 'Unauthorized');
		await ensureMembership(projectId, userId);
		let ctx = await loadProjectContext(projectId);

		// Jika proyek belum punya status sama sekali, buat status yang diajukan AI.
		if (ctx.statuses.length === 0) {
			const proposedNames = [
				...new Set(
					drafts.map((d) => d.statusName?.trim()).filter((n): n is string => !!n)
				)
			];
			for (let i = 0; i < proposedNames.length; i++) {
				const created = await taskStatusService.create(
					{ name: proposedNames[i], order: i, projectId },
					{ actorId: userId }
				);
				ctx.statuses.push({ id: created.id, name: created.name });
			}
		}

		let created = 0;
		for (const draft of drafts) {
			const resolved = resolveTaskFields(draft, ctx);
			await taskService.create(
				{
					name: draft.title,
					description: draft.description ?? null,
					projectId,
					assigneeId: resolved.assigneeId,
					statusId: resolved.statusId,
					startDate: resolved.startDate,
					endDate: resolved.endDate
				},
				{ actorId: userId }
			);
			created += 1;
		}
		return { created };
	}
);
