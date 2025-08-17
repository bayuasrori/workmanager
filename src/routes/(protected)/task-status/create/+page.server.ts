import { taskStatusService } from '$lib/server/service';
import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const name = data.get('name') as string;
        await taskStatusService.create({ name });
        throw redirect(303, '/task-status');
    }
};