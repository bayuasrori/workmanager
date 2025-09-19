import { taskService, projectService, userService, taskStatusService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const projects = await projectService.getAll();
	const users = await userService.getAll();

	// Get task statuses for the selected project, or all if no project selected
	const projectId = url.searchParams.get('projectId');
	const taskStatuses = projectId ? await taskStatusService.getByProjectId(projectId) : [];

	return { projects, users, taskStatuses };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const projectIdField = data.get('projectId');
		const assigneeIdField = data.get('assigneeId');
		const statusIdField = data.get('statusId');
		const projectId =
			typeof projectIdField === 'string' && projectIdField.length > 0 ? projectIdField : null;
		const assigneeId =
			typeof assigneeIdField === 'string' && assigneeIdField.length > 0 ? assigneeIdField : null;
		const statusId =
			typeof statusIdField === 'string' && statusIdField.length > 0 ? statusIdField : null;
		await taskService.create({
			name,
			description: null,
			projectId,
			assigneeId,
			statusId,
			startDate: null,
			endDate: null
		}, { actorId: locals.user?.id });
		throw redirect(303, '/tasks');
	}
};
