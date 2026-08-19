/**
 * Database schema.
 *
 * Naming follows the functional plan: entities in PascalCase map to snake_case
 * tables, fields in camelCase map to snake_case columns — a mechanical
 * translation, per the plan's own convention note.
 */

import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['Administrator', 'User'])
export const projectStatusEnum = pgEnum('project_status', [
  'Draft',
  'Active',
  'OnHold',
  'Completed',
  'Cancelled',
])
export const priorityEnum = pgEnum('priority', ['High', 'Medium', 'Low'])
export const taskStatusEnum = pgEnum('task_status', [
  'Todo',
  'InProgress',
  'Waiting',
  'Completed',
  'Cancelled',
])
export const attachmentTypeEnum = pgEnum('attachment_type', ['File', 'Link'])
export const attachmentParentTypeEnum = pgEnum('attachment_parent_type', ['Project', 'Task'])
export const auditEntityTypeEnum = pgEnum('audit_entity_type', [
  'Project',
  'Task',
  'User',
  'Requester',
  'OrganizationalUnit',
  'Tag',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  // Null until the one-time set-password link (first access, or an
  // administrator-mediated reset) has been used — see lib/auth/password-reset.
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('User'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const organizationalUnits = pgTable('organizational_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const requesters = pgTable('requesters', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  unitId: uuid('unit_id')
    .notNull()
    .references(() => organizationalUnits.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Human-readable progressive identifier (e.g. "2026-014"), for citing the
  // project in communications with the requester — open question #1.
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366f1'),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('Draft'),
  priority: priorityEnum('priority').notNull().default('Medium'),
  progressPercent: integer('progress_percent').notNull().default(0),
  progressUpdatedAt: timestamp('progress_updated_at', { withTimezone: true }),
  requestDate: date('request_date'),
  startDate: date('start_date'),
  dueDate: date('due_date'),
  completionDate: date('completion_date'),
  requesterId: uuid('requester_id')
    .notNull()
    .references(() => requesters.id),
  // Snapshot of the requester's unit at creation time, so historical reports
  // stay stable even if the requester later moves to a different unit
  // (open question #5 — resolved in favor of freezing).
  requesterUnitId: uuid('requester_unit_id')
    .notNull()
    .references(() => organizationalUnits.id),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.userId] })],
)

export const projectTags = pgTable(
  'project_tags',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.tagId] })],
)

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('Todo'),
  priority: priorityEnum('priority').notNull().default('Medium'),
  dueDate: date('due_date'),
  estimatedHours: numeric('estimated_hours', { precision: 6, scale: 2 }),
  // Must belong to the project's members (owner included) — enforced in the
  // application layer, both on task write and on member removal.
  assigneeId: uuid('assignee_id').references(() => users.id),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  isDone: boolean('is_done').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Polymorphic parent (Project | Task) — no FK, enforced in the app layer.
  parentType: attachmentParentTypeEnum('parent_type').notNull(),
  parentId: uuid('parent_id').notNull(),
  type: attachmentTypeEnum('type').notNull(),
  label: text('label').notNull(),
  fileRef: text('file_ref'),
  url: text('url'),
  uploadedById: uuid('uploaded_by_id')
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
})

export const projectComments = pgTable('project_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const auditEntries = pgTable('audit_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: auditEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  field: text('field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedById: uuid('changed_by_id')
    .notNull()
    .references(() => users.id),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * One-time tokens for the administrator-mediated password flow (first access
 * and "forgot password" both use this — v1 has no outbound email, per §6/§3.6,
 * so an Administrator generates the link and delivers it out of band).
 */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
