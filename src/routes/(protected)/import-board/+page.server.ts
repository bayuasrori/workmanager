import { organizationService, publicBoardService, projectService, taskStatusService, taskService } from '$lib/server/service';
import { db } from '$lib/server/db';
import { projectMember } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const orgs = await organizationService.getAll();
    const organizations = orgs.filter((o: any) => o.name !== 'Public');
    return { organizations };
};

function extractSlugFromUrl(url: string): string | null {
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        const slugIndex = parts.findIndex((p) => p === 'public-board');
        if (slugIndex !== -1 && parts[slugIndex + 1]) {
            return parts[slugIndex + 1];
        }
        if (parts.length === 1) return parts[0];
        return null;
    } catch {
        return url.trim() || null;
    }
}

export const actions: Actions = {
    import: async ({ request, locals }) => {
        const data = await request.formData();
        const boardUrl = (data.get('boardUrl') as string) || '';
        const organizationId = (data.get('organizationId') as string) || '';

        if (!boardUrl.trim()) return fail(400, { message: 'Board URL or slug is required' });
        if (!organizationId) return fail(400, { message: 'Destination organization is required' });

        const slug = extractSlugFromUrl(boardUrl);
        if (!slug) return fail(400, { message: 'Invalid board URL' });

        const board = await publicBoardService.getBySlug(slug);
        if (!board) return fail(404, { message: 'Public board not found' });

        // Create project and capture id
        const createdProject = await projectService.create({
            name: board.name,
            description: board.description || undefined,
            slug: `${board.slug}-${crypto.randomUUID().slice(0, 6)}`,
            organizationId,
            isPublic: false
        } as any);

        const newProjectId = (createdProject as any).id;

        // Add current user as a project member if logged in
        if (locals.user?.id) {
            await db.insert(projectMember).values({ projectId: newProjectId, userId: locals.user.id });
        }

        // Create statuses in order and keep a map
        const statusMap = new Map<string, string>();
        for (const s of board.taskStatuses) {
            const inserted = await taskStatusService.create({
                name: s.name,
                order: s.order,
                projectId: newProjectId
            } as any);
            const newStatusId = ((inserted as any).id ?? (inserted as any)[0]?.id) as string;
            if (!newStatusId) {
                continue;
            }
            statusMap.set(s.id, newStatusId);
        }

        // Copy tasks
        for (const t of board.tasks) {
            const fallbackStatusId = Array.from(statusMap.values())[0] as string | undefined;
            const mappedStatusId = (t.statusId ? statusMap.get(t.statusId) : undefined) ?? fallbackStatusId;
            if (!mappedStatusId) continue;
            await taskService.create({
                name: t.name,
                description: t.description || undefined,
                projectId: newProjectId,
                statusId: mappedStatusId,
                assigneeId: null
            } as any);
        }

        throw redirect(303, `/project/${newProjectId}/tasks`);
    }
};


