import { userService } from '../../lib/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const users = await userService.getAll();
	return { users };
};

export const actions: Actions = {
	delete: async ({ url }) => {
		const id = url.searchParams.get('id');
		if (!id) return { success: false };
		await userService.delete(id);
		return { success: true };
	}
};
