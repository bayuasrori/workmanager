import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import {
	organizationService,
	publicBoardService,
	projectService,
	taskStatusService,
	taskService
} from '$lib/server/service';
import { db } from '$lib/server/db';
import { projectMember } from '$lib/server/db/schema';

const extractSlugFromUrl = (url: string): string | null => {
	try {
		const parsed = new URL(url);
		const parts = parsed.pathname.split('/').filter(Boolean);
		const slugIndex = parts.findIndex((p) => p === 'public-board');
		if (slugIndex !== -1 && parts[slugIndex + 1]) {
			return parts[slugIndex + 1];
		}
		if (parts.length === 1) return parts[0];
		return null;
	} catch {
		return url.trim() || null;
	}
};

export const getImportBoardData = query(async () => {
	const { locals } = getRequestEvent();
	const userId = locals.user?.id;
	if (!userId) {
		return { organizations: [] };
	}
	const orgs = await organizationService.getByMemberUserId(userId);
	const organizations = orgs.filter((organization) => organization.name !== 'Public');
	return { organizations };
});

export const importBoard = command(
	v.object({
		boardUrl: v.pipe(v.string(), v.nonEmpty('Board URL or slug is required')),
		organizationId: v.pipe(v.string(), v.nonEmpty('Destination organization is required'))
	}),
	async ({ boardUrl, organizationId }) => {
		const { locals } = getRequestEvent();
		const userId = locals.user?.id;
		if (!userId) {
			throw error(401, 'Unauthorized');
		}
		const allowedOrganizations = await organizationService.getByMemberUserId(userId);
		const hasAccess = allowedOrganizations.some((org) => org.id === organizationId);
		if (!hasAccess) {
			throw error(403, 'You are not a member of the selected organization');
		}

		const slug = extractSlugFromUrl(boardUrl);
		if (!slug) {
			throw error(400, 'Invalid board URL');
		}

		const board = await publicBoardService.getBySlug(slug);
		if (!board) {
			throw error(404, 'Public board not found');
		}

		const createdProject = await projectService.create({
			name: board.name,
			description: board.description ?? null,
			slug: `${board.slug}-${crypto.randomUUID().slice(0, 6)}`,
			organizationId,
			isPublic: false
		});

		const newProjectId = createdProject.id;

		if (locals.user?.id) {
			await db.insert(projectMember).values({ projectId: newProjectId, userId: locals.user.id });
		}

		const statusMap = new Map<string, string>();
		for (const status of board.taskStatuses) {
			const insertedStatus = await taskStatusService.create(
				{
					name: status.name,
					order: status.order ?? 0,
					projectId: newProjectId
				},
				{ actorId: locals.user?.id }
			);
			statusMap.set(status.id, insertedStatus.id);
		}

		for (const task of board.tasks) {
			const fallbackStatusId = Array.from(statusMap.values())[0];
			const mappedStatusId =
				(task.statusId ? statusMap.get(task.statusId) : undefined) ?? fallbackStatusId;
			if (!mappedStatusId) continue;
			await taskService.create(
				{
					name: task.name,
					description: task.description ?? null,
					projectId: newProjectId,
					statusId: mappedStatusId,
					assigneeId: null,
					startDate: null,
					endDate: null
				},
				{ actorId: locals.user?.id }
			);
		}

		return { projectId: newProjectId };
	}
);
