import type { RequestHandler } from './$types';
import { taskStatusService } from '$lib/server/service/taskStatus';

export const GET: RequestHandler = async ({ params }) => {
	const projectId = params.id;

	const taskStatuses = await taskStatusService.getByProjectId(projectId);
	return new Response(JSON.stringify({ taskStatuses }));
};
