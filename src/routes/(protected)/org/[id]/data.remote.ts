import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { organizationMemberService, organizationService, userService } from '$lib/server/service';

const ensureAccess = async (organizationId: string) => {
	const { locals } = getRequestEvent();
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}
	const organization = await organizationService.getById(organizationId);
	if (!organization) {
		throw error(404, 'Organization not found');
	}
	const isMember = await organizationMemberService.isMember(organizationId, userId);
	if (!isMember && organization.ownerId !== userId) {
		throw error(403, 'Forbidden');
	}
	return { organization, userId };
};

export const getOrganizationDetails = query(
	v.object({
		organizationId: v.string()
	}),
	async ({ organizationId }) => {
		const { organization } = await ensureAccess(organizationId);
		const users = await userService.getUsersNotInOrganization(organizationId);
		const members = await organizationMemberService.getByOrganizationId(organizationId);
		return { organization, users, members };
	}
);

export const updateOrganization = command(
	v.object({
		organizationId: v.string(),
		name: v.pipe(v.string(), v.nonEmpty()),
		ownerId: v.string()
	}),
	async ({ organizationId, name, ownerId }) => {
		await ensureAccess(organizationId);
		await organizationService.update(organizationId, { name, ownerId });
		return { success: true };
	}
);

export const addMember = command(
	v.object({
		organizationId: v.string(),
		userId: v.string()
	}),
	async ({ organizationId, userId }) => {
		await ensureAccess(organizationId);
		await organizationMemberService.create({ organizationId, userId });
		return { success: true };
	}
);

export const removeMember = command(
	v.object({
		organizationId: v.string(),
		userId: v.string()
	}),
	async ({ organizationId, userId }) => {
		await ensureAccess(organizationId);
		await organizationMemberService.delete(organizationId, userId);
		return { success: true };
	}
);
