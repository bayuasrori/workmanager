import { taskService, taskStatusService } from '$lib/server/service';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({locals}) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }
    const user_id = locals.user?.id
    const taskCount = await taskService.getUserTaskCount(user_id);

    const tasks_status = await taskStatusService.getTaskCountInStatus();
    console.log(tasks_status);
    
    return { taskCount, tasks_status };


}