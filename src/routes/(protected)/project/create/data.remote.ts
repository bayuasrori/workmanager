import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { organizationService, projectService, assertProjectLimit } from '$lib/server/service';

export const getProjectCreateData = query(async () => {
	const { locals } = getRequestEvent();
	const userId = locals.user?.id;
	if (!userId) {
		return { organizations: [] };
	}
	const organizations = await organizationService.getByMemberUserId(userId);
	return { organizations };
});

export const createProject = command(
	v.object({
		name: v.pipe(v.string(), v.nonEmpty('Nama proyek tidak boleh kosong.')),
		organizationId: v.optional(v.string())
	}),
	async ({ name, organizationId }) => {
		const { locals } = getRequestEvent();
		const userId = locals.user?.id;
		if (organizationId) {
			if (!userId) {
				throw error(401, 'Unauthorized');
			}
			const allowed = await organizationService.getByMemberUserId(userId);
			const hasAccess = allowed.some((org) => org.id === organizationId);
			if (!hasAccess) {
				throw error(403, 'Forbidden');
			}
		}
		if (userId) {
			await assertProjectLimit(userId);
		}
		const creatorId = userId ?? undefined;
		const created = await projectService.create(
			{
				name,
				description: null,
				slug: null,
				organizationId: organizationId ?? null,
				isPublic: false
			},
			creatorId
		);
		return { id: created.id };
	}
);
