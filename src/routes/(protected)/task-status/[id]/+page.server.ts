import { taskStatusService } from '$lib/server/service';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const taskStatus = await taskStatusService.getById(params.id);
    return { taskStatus };
};

export const actions: Actions = {
    updateStatus: async ({ request, params }) => {
        const data = await request.formData();
        const name = data.get('name') as string;
        await taskStatusService.update(params.id, { name });
        throw redirect(303, '/task-status');
    }
};
