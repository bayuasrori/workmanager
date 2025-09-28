import { organizationService } from '$lib/server/service';
import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizationMember } from '$lib/server/db/schema';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const ownerField = data.get('ownerId');
		const ownerId =
			typeof ownerField === 'string' && ownerField.length > 0
				? ownerField
				: (locals.user?.id ?? null);
		const org = await organizationService.create({ name, ownerId });
		if (ownerId) {
			await db.insert(organizationMember).values({ organizationId: org.id, userId: ownerId });
		}
		throw redirect(303, '/org');
	}
};
