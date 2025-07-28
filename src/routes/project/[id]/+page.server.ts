import { projectService, organizationService } from '../../../lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const project = await projectService.getById(params.id);
	const organizations = await organizationService.getAll();
	return { project, organizations };
};

export const actions: Actions = {
	updateProject: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const organizationId = data.get('organizationId') as string;
		await projectService.update(params.id, { name, organizationId });
		throw redirect(303, '/project');
	}
};
