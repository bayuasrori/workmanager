import * as v from 'valibot';
import { command, getRequestEvent } from '$app/server';
import { organizationService } from '$lib/server/service';
import { db } from '$lib/server/db';
import { organizationMember } from '$lib/server/db/schema';

export const createOrganization = command(
	v.object({
		name: v.pipe(v.string(), v.nonEmpty('Nama organisasi wajib diisi.'))
	}),
	async ({ name }) => {
		const { locals } = getRequestEvent();
		const ownerId = locals.user?.id ?? null;
		const organization = await organizationService.create({ name, ownerId });
		if (ownerId) {
			await db
				.insert(organizationMember)
				.values({ organizationId: organization.id, userId: ownerId });
		}
		return { id: organization.id };
	}
);
