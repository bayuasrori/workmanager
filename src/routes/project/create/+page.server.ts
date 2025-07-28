import { projectService, organizationService } from '../../../lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const organizations = await organizationService.getAll();
	return { organizations };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const organizationId = data.get('organizationId') as string;
		await projectService.create({ name, organizationId });
		throw redirect(303, '/project');
	}
};
