import { text, sqliteTable } from 'drizzle-orm/sqlite-core';

export const membershipType = sqliteTable('membership_type', {
	id: text('id').primaryKey(),
	name: text('name', { enum: ['free', 'pro', 'team'] }).notNull()
});
