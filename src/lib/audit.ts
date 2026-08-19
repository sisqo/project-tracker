/**
 * Audit trail helper. One convention for every call site so the log stays
 * comparable across entities: scalar fields are stringified as-is (dates as
 * ISO, numbers/booleans as their string form), relation sets (Project
 * members, Project tags) are a sorted, comma-joined list of a stable display
 * key — email for users, name for tags — never raw ids.
 */

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { auditEntries, users } from '@/lib/db/schema'

export type AuditEntityType = (typeof auditEntries.$inferInsert)['entityType']

export type FieldChange = {
  field: string
  oldValue: string | null
  newValue: string | null
}

/** A single user-relation field (Task.assignee) uses the same display key as the sets — email, never a raw id. */
export async function resolveUserEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null
  const [user] = await db().select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
  return user?.email ?? null
}

export function serializeSet(values: string[]): string {
  return [...values].sort((a, b) => a.localeCompare(b)).join(', ')
}

export function serializeScalar(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export async function recordAuditEntries(
  entityType: AuditEntityType,
  entityId: string,
  changes: FieldChange[],
  changedById: string,
): Promise<void> {
  const rows = changes.filter((c) => c.oldValue !== c.newValue)
  if (rows.length === 0) return

  await db()
    .insert(auditEntries)
    .values(
      rows.map((c) => ({
        entityType,
        entityId,
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
        changedById,
      })),
    )
}

export async function recordAuditEntry(
  entityType: AuditEntityType,
  entityId: string,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  changedById: string,
): Promise<void> {
  await recordAuditEntries(
    entityType,
    entityId,
    [{ field, oldValue: serializeScalar(oldValue), newValue: serializeScalar(newValue) }],
    changedById,
  )
}
