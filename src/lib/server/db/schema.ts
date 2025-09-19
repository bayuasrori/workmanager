import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
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
	description: text('description'),
	slug: text('slug').unique(),
	organizationId: text('organization_id').references(() => organization.id),
	isPublic: integer('is_public', { mode: 'boolean' }).default(false)
});

export const projectMember = sqliteTable('project_member', {
	projectId: text('project_id').references(() => project.id),
	userId: text('user_id').references(() => user.id)
});

export const task_status = sqliteTable('task_status', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	order: integer('order').notNull().default(0),
	projectId: text('project_id').references(() => project.id)
});

export const task = sqliteTable('task', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	projectId: text('project_id').references(() => project.id),
	assigneeId: text('assignee_id').references(() => user.id),
	statusId: text('status_id').references(() => task_status.id),
	startDate: integer('start_date', { mode: 'timestamp' }),
	endDate: integer('end_date', { mode: 'timestamp' })
});

export const taskComment = sqliteTable('task_comment', {
	id: text('id').primaryKey(),
	content: text('content').notNull(),
	taskId: text('task_id').references(() => task.id),
	userId: text('user_id').references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const activity = sqliteTable('activity', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id),
	taskId: text('task_id').references(() => task.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	type: text('type').notNull(),
	description: text('description'),
	metadata: text('metadata'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const projectRelations = relations(project, ({ one, many }) => ({
	organization: one(organization, {
		fields: [project.organizationId],
		references: [organization.id]
	}),
	tasks: many(task)
}));

export const taskRelations = relations(task, ({ one, many }) => ({
	assignee: one(user, {
		fields: [task.assigneeId],
		references: [user.id]
	}),
	status: one(task_status, {
		fields: [task.statusId],
		references: [task_status.id]
	}),
	project: one(project, {
		fields: [task.projectId],
		references: [project.id]
	}),
	comments: many(taskComment)
}));

export const taskStatusRelations = relations(task_status, ({ one, many }) => ({
	project: one(project, {
		fields: [task_status.projectId],
		references: [project.id]
	}),
	tasks: many(task)
}));

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type OrganizationMember = typeof organizationMember.$inferSelect;
export type Project = typeof project.$inferSelect;
export type ProjectMember = typeof projectMember.$inferSelect;
export type Task = typeof task.$inferSelect;
export type TaskStatus = typeof task_status.$inferSelect;
export type TaskComment = typeof taskComment.$inferSelect;
export type Activity = typeof activity.$inferSelect;
