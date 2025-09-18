import { projectService, organizationService } from '$lib/server/service';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const organizations = await organizationService.getAll();
	return { organizations };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const organizationIdField = data.get('organizationId');
		const organizationId =
			typeof organizationIdField === 'string' && organizationIdField.length > 0
				? organizationIdField
				: null;
		await projectService.create({
			name,
			description: null,
			slug: null,
			organizationId,
			isPublic: false
		});
		throw redirect(303, '/project');
	}
};
