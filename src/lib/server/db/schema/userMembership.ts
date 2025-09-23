import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { user } from '../schema';
import { membershipType } from './membershipType';

export const userMembership = sqliteTable('user_membership', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	membershipTypeId: text('membership_type_id')
		.notNull()
		.references(() => membershipType.id),
	startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
	endDate: integer('end_date', { mode: 'timestamp' })
});
