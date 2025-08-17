import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const organization = sqliteTable('organization', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	ownerId: text('owner_id').references(() => user.id)
});

export const organizationMember = sqliteTable('organization_member', {
	organizationId: text('organization_id').references(() => organization.id),
	userId: text('user_id').references(() => user.id)
});

export const project = sqliteTable('project', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	organizationId: text('organization_id').references(() => organization.id)
});


export const projectMember = sqliteTable('project_member', {
	projectId: text('project_id').references(() => project.id),
	userId: text('user_id').references(() => user.id)
});

export const task_status = sqliteTable('task_status', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique()
});

export const task = sqliteTable('task', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	projectId: text('project_id').references(() => project.id),
	assigneeId: text('assignee_id').references(() => user.id),
	statusId: text('status_id').references(() => task_status.id)
});

export const taskRelations = relations(task, ({ one }) => ({
	assignee: one(user, {
		fields: [task.assigneeId],
		references: [user.id]
	}),
	status: one(task_status, {
		fields: [task.statusId],
		references: [task_status.id]
	})
}));

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type OrganizationMember = typeof organizationMember.$inferSelect;
export type Project = typeof project.$inferSelect;
export type ProjectMember = typeof projectMember.$inferSelect;
export type Task = typeof task.$inferSelect;
export type TaskStatus = typeof task_status.$inferSelect;
