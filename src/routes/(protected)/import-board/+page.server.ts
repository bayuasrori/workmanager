import {
	organizationService,
	publicBoardService,
	projectService,
	taskStatusService,
	taskService
} from '$lib/server/service';
import { db } from '$lib/server/db';
import { projectMember } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Organization } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const orgs = await organizationService.getAll();
	const organizations = orgs.filter((o: Organization) => o.name !== 'Public');
	return { organizations };
};

function extractSlugFromUrl(url: string): string | null {
	try {
		const u = new URL(url);
		const parts = u.pathname.split('/').filter(Boolean);
		const slugIndex = parts.findIndex((p) => p === 'public-board');
		if (slugIndex !== -1 && parts[slugIndex + 1]) {
			return parts[slugIndex + 1];
		}
		if (parts.length === 1) return parts[0];
		return null;
	} catch {
		return url.trim() || null;
	}
}

export const actions: Actions = {
	import: async ({ request, locals }) => {
		const data = await request.formData();
		const boardUrl = (data.get('boardUrl') as string) || '';
		const organizationId = (data.get('organizationId') as string) || '';

		if (!boardUrl.trim()) return fail(400, { message: 'Board URL or slug is required' });
		if (!organizationId) return fail(400, { message: 'Destination organization is required' });

		const slug = extractSlugFromUrl(boardUrl);
		if (!slug) return fail(400, { message: 'Invalid board URL' });

		const board = await publicBoardService.getBySlug(slug);
		if (!board) return fail(404, { message: 'Public board not found' });

		// Create project and capture id
		const createdProject = await projectService.create({
			name: board.name,
			description: board.description ?? null,
			slug: `${board.slug}-${crypto.randomUUID().slice(0, 6)}`,
			organizationId,
			isPublic: false
		});

		const newProjectId = createdProject.id;

		// Add current user as a project member if logged in
		if (locals.user?.id) {
			await db.insert(projectMember).values({ projectId: newProjectId, userId: locals.user.id });
		}

		// Create statuses in order and keep a map
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

		// Copy tasks
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

		throw redirect(303, `/project/${newProjectId}/tasks`);
	}
};
