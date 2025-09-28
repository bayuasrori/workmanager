import {
	pgTable,
	integer,
	text,
	varchar,
	boolean,
	timestamp,
	uuid,
	primaryKey,
	numeric,
	jsonb,
	pgEnum
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);
export const paymentGatewayProviderEnum = pgEnum('payment_gateway_provider', [
	'custom',
	'manual',
	'stripe',
	'paypal',
	'adyen',
	'razorpay'
]);
export const paymentGatewayStatusEnum = pgEnum('payment_gateway_status', ['inactive', 'test', 'active']);
export const membershipPlanEnum = pgEnum('membership_plan', ['free', 'pro', 'team']);

export const user = pgTable('user', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	age: integer('age'),
	username: varchar('username', { length: 255 }).notNull().unique(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	isAdmin: boolean('is_admin').default(false),
	createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

export const session = pgTable('session', {
	id: uuid('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at').notNull()
});

export const organization = pgTable('organization', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 255 }).notNull(),
	ownerId: uuid('owner_id').references(() => user.id)
});

export const organizationMember = pgTable('organization_member', {
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organization.id),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id)
}, (table) => {
	return {
		pk: primaryKey({ columns: [table.organizationId, table.userId] })
	}
});

export const project = pgTable('project', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	slug: varchar('slug', { length: 255 }).unique(),
	organizationId: uuid('organization_id').references(() => organization.id),
	isPublic: boolean('is_public').default(false)
});

export const projectMember = pgTable('project_member', {
	projectId: uuid('project_id')
		.notNull()
		.references(() => project.id),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id)
}, (table) => {
	return {
		pk: primaryKey({ columns: [table.projectId, table.userId] })
	}
});

export const membershipType = pgTable('membership_type', {
	id: text('id').primaryKey(),
	name: membershipPlanEnum('name').notNull(),
	description: text('description'),
	price: numeric('price', { precision: 12, scale: 2 }).default(sql`0`),
	currency: varchar('currency', { length: 3 }).default('USD'),
	isDefault: boolean('is_default').default(false)
});

export const userMembership = pgTable('user_membership', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	membershipTypeId: text('membership_type_id')
		.notNull()
		.references(() => membershipType.id),
	startDate: timestamp('start_date').notNull().default(sql`now()`),
	endDate: timestamp('end_date'),
	isActive: boolean('is_active').notNull().default(true)
});

export const paymentGateway = pgTable('payment_gateway', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 255 }).notNull(),
	provider: paymentGatewayProviderEnum('provider').notNull(),
	status: paymentGatewayStatusEnum('status').notNull().default('inactive'),
	credentials: jsonb('credentials')
		.$type<Record<string, unknown>>()
		.notNull()
		.default(sql`'{}'::jsonb`),
	webhookSecret: varchar('webhook_secret', { length: 255 }),
	metadata: jsonb('metadata').$type<Record<string, unknown> | null>().default(null),
	createdAt: timestamp('created_at').notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

export const task_status = pgTable('task_status', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 255 }).notNull(),
	order: integer('order').notNull().default(0),
	projectId: uuid('project_id').references(() => project.id)
});

export const task = pgTable('task', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	projectId: uuid('project_id').references(() => project.id),
	assigneeId: uuid('assignee_id').references(() => user.id),
	statusId: uuid('status_id').references(() => task_status.id),
	startDate: timestamp('start_date'),
	endDate: timestamp('end_date')
});

export const taskComment = pgTable('task_comment', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	content: text('content').notNull(),
	taskId: uuid('task_id').references(() => task.id),
	userId: uuid('user_id').references(() => user.id),
	createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

export const activity = pgTable('activity', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	projectId: uuid('project_id')
		.notNull()
		.references(() => project.id),
	taskId: uuid('task_id').references(() => task.id),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	type: varchar('type', { length: 255 }).notNull(),
	description: text('description'),
	metadata: text('metadata'),
	createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

export const payment = pgTable('payment', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	gatewayId: uuid('gateway_id').references(() => paymentGateway.id),
	amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
	currency: varchar('currency', { length: 3 }).notNull(),
	status: paymentStatusEnum('status').notNull().default('pending'),
	intentId: varchar('intent_id', { length: 255 }),
	externalId: varchar('external_id', { length: 255 }),
	description: text('description'),
	metadata: jsonb('metadata').$type<Record<string, unknown> | null>().default(null),
	errorCode: varchar('error_code', { length: 255 }),
	errorMessage: text('error_message'),
	createdAt: timestamp('created_at').notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
	completedAt: timestamp('completed_at')
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

export const paymentRelations = relations(payment, ({ one }) => ({
	user: one(user, {
		fields: [payment.userId],
		references: [user.id]
	}),
	gateway: one(paymentGateway, {
		fields: [payment.gatewayId],
		references: [paymentGateway.id]
	})
}));

export const paymentGatewayRelations = relations(paymentGateway, ({ many }) => ({
	payments: many(payment)
}));

export const userMembershipRelations = relations(userMembership, ({ one }) => ({
	user: one(user, {
		fields: [userMembership.userId],
		references: [user.id]
	}),
	membershipType: one(membershipType, {
		fields: [userMembership.membershipTypeId],
		references: [membershipType.id]
	})
}));

export const membershipTypeRelations = relations(membershipType, ({ many }) => ({
	memberships: many(userMembership)
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
export type Payment = typeof payment.$inferSelect;
export type PaymentGateway = typeof paymentGateway.$inferSelect;
export type MembershipType = typeof membershipType.$inferSelect;
export type UserMembership = typeof userMembership.$inferSelect;
