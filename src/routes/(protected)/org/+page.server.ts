import { organizationService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const organizations = await organizationService.getAll();
	return { organizations };
};

export const actions: Actions = {
	delete: async ({ url }) => {
		const id = url.searchParams.get('id');
		if (!id) return { success: false };
		await organizationService.delete(id);
		return { success: true };
	}
};
