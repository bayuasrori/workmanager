import { taskService } from '$lib/server/service/task';
import { taskStatusService } from '$lib/server/service/taskStatus';
import { projectService, organizationService } from '$lib/server/service';
import { json, redirect, fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/login');
	}
	const projectId = params.id;
	const isMember = await projectService.isMember(projectId, userId);
	if (!isMember) {
		throw error(403, 'You are not a member of this project');
	}

	const statusId = url.searchParams.get('status');
	let tasks;
	if (statusId) {
		tasks = await taskService.getByProjectIdAndStatus(projectId, statusId);
	} else {
		tasks = await taskService.getByProjectId(projectId);
	}
	const taskStatuses = await taskStatusService.getByProjectId(projectId);
	const project = await projectService.getById(projectId);
	return { tasks, taskStatuses, project };
};

export const actions: Actions = {
	updateTaskStatus: async ({ request, locals, params }) => {
		const userId = locals.user?.id;
		if (!userId) throw error(401, 'Unauthorized');
		const isMember = await projectService.isMember(params.id, userId);
		if (!isMember) throw error(403, 'Forbidden');

		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		const newStatusId = data.get('newStatusId') as string;
		await taskService.update(taskId, { statusId: newStatusId }, { actorId: locals.user?.id });
		return { success: true };
	},
	createStatus: async ({ request, params, locals }) => {
		const userId = locals.user?.id;
		if (!userId) throw error(401, 'Unauthorized');
		const isMember = await projectService.isMember(params.id, userId);
		if (!isMember) throw error(403, 'Forbidden');

		const data = await request.formData();
		const name = data.get('name') as string;

		if (!name || name.trim().length === 0) {
			return { success: false, error: 'Status name is required' };
		}

		const created = await taskStatusService.createForProject(params.id, name.trim(), {
			actorId: locals.user?.id
		});
		const statusRecord = Array.isArray(created) ? created[0] : created;
		return { success: true, status: statusRecord };
	},
	reorderStatuses: async ({ request, params, locals }) => {
		const userId = locals.user?.id;
		if (!userId) throw error(401, 'Unauthorized');
		const isMember = await projectService.isMember(params.id, userId);
		if (!isMember) throw error(403, 'Forbidden');

		try {
			const formData = await request.formData();
			const raw = formData.get('orderedIds');
			if (typeof raw !== 'string') {
				return { success: false };
			}
			let orderedIds: string[] = [];
			try {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					orderedIds = parsed.map(String);
				}
			} catch (error) {
				console.error('Failed to parse reordered status payload', error);
			}
			if (orderedIds.length === 0) {
				return { success: false };
			}
			await taskStatusService.reorderForProject(params.id, orderedIds, {
				actorId: locals.user?.id
			});
			// const taskStatuses = await taskStatusService.getByProjectId(params.id);
			return { success: true };
		} catch (error) {
			console.error('Failed to reorder statuses', error);
			return { success: false };
		}
	},
	deleteProject: async ({ params, locals }) => {
		const userId = locals.user?.id;
		if (!userId) throw error(401, 'Unauthorized');
		const project = await projectService.getById(params.id);
		if (!project) throw error(404, 'Not Found');
		if (project.organizationId) {
			const org = await organizationService.getById(project.organizationId);
			if (org?.ownerId !== userId) throw error(403, 'Forbidden');
		} else {
			const isMember = await projectService.isMember(params.id, userId);
			if (!isMember) throw error(403, 'Forbidden');
		}

		await projectService.deleteCascade(params.id);
		throw redirect(303, '/project');
	},
	deleteTaskStatus: async ({ request, locals, params }) => {
		const userId = locals.user?.id;
		if (!userId) throw error(401, 'Unauthorized');
		const isMember = await projectService.isMember(params.id, userId);
		if (!isMember) throw error(403, 'Forbidden');

		const data = await request.formData();
		const statusId = data.get('statusId') as string;
		if (!statusId) {
			return fail(400, { success: false, error: 'Status ID is required' });
		}
		await taskStatusService.delete(statusId, { actorId: locals.user?.id });
		return { success: true };
	}
};
