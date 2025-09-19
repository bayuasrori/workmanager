import { projectService, organizationService, userService } from '$lib/server/service';
import { db } from '$lib/server/db';
import { projectMember, user } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const project = await projectService.getById(params.id);
	const organizations = await organizationService.getAll();
	const projectMembers = await db
		.select({
			userId: projectMember.userId,
			username: user.username,
			email: user.email
		})
		.from(projectMember)
		.innerJoin(user, eq(user.id, projectMember.userId))
		.where(eq(projectMember.projectId, params.id));
	const users = await userService.getAll();
	const availableUsers = users.filter((u) => !projectMembers.some((pm) => pm.userId === u.id));
	return { project, organizations, projectMembers, availableUsers };
};

export const actions: Actions = {
	updateProject: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const organizationId = data.get('organizationId') as string;
		await projectService.update(params.id, { name, organizationId });
		throw redirect(303, '/project');
	},
	addMember: async ({ request, params }) => {
		const data = await request.formData();
		const userId = data.get('userId');
		if (!userId || typeof userId !== 'string') {
			return fail(400, { message: 'Pengguna tidak valid.' });
		}
		await db
			.insert(projectMember)
			.values({ projectId: params.id, userId })
			.onConflictDoNothing();
		return { success: true };
	},
	removeMember: async ({ request, params }) => {
		const data = await request.formData();
		const userId = data.get('userId');
		if (!userId || typeof userId !== 'string') {
			return fail(400, { message: 'Pengguna tidak valid.' });
		}
		await db
			.delete(projectMember)
			.where(and(eq(projectMember.projectId, params.id), eq(projectMember.userId, userId)));
		return { success: true };
	}
};
