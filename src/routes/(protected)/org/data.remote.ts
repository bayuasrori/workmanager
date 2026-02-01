import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { organizationMemberService, organizationService } from '$lib/server/service';

export const getOrganizations = query(async () => {
	const { locals } = getRequestEvent();
	const userId = locals.user?.id;
	if (!userId) {
		return { organizations: [] };
	}
	const organizations = await organizationService.getByMemberUserId(userId);
	return { organizations };
});

export const deleteOrganization = command(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		const { locals } = getRequestEvent();
		const userId = locals.user?.id;
		if (!userId) {
			throw error(401, 'Unauthorized');
		}
		const membership = await organizationMemberService.get(id, userId);
		if (!membership) {
			const organization = await organizationService.getById(id);
			if (!organization || organization.ownerId !== userId) {
				throw error(403, 'Forbidden');
			}
		}

		await organizationService.delete(id);
		return { success: true };
	}
);
