import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { userService } from '$lib/server/service';

const requireAdmin = () => {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (!locals.user.isAdmin) {
		throw error(403, 'Forbidden');
	}
	return locals.user;
};

export const getUsers = query(async () => {
	requireAdmin();
	const users = await userService.getAll();
	return { users };
});

export const deleteUser = command(
	v.object({
		userId: v.string()
	}),
	async ({ userId }) => {
		requireAdmin();
		await userService.delete(userId);
		return { success: true };
	}
);
