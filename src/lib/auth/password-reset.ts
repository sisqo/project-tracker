/**
 * Administrator-mediated password flow — the same mechanism serves both
 * "first access" (a new User has no password yet) and "forgot password"
 * (§3.6), because v1 has no outbound email (§6). An Administrator generates a
 * one-time link from the user's profile page and delivers it out of band —
 * the same way the plan already has the app communicate with a Requester.
 */

import { randomBytes, createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { passwordResetTokens } from '@/lib/db/schema'

const TOKEN_BYTES = 32
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export async function createPasswordSetToken(userId: string, createdById: string): Promise<string> {
  const rawToken = randomBytes(TOKEN_BYTES).toString('base64url')
  await db()
    .insert(passwordResetTokens)
    .values({
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      createdById,
    })
  return rawToken
}

export type TokenCheck =
  | { valid: true; userId: string }
  | { valid: false; reason: 'not_found' | 'used' | 'expired' }

export async function checkPasswordSetToken(rawToken: string): Promise<TokenCheck> {
  const [row] = await db()
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, hashToken(rawToken)))
    .limit(1)

  if (!row) return { valid: false, reason: 'not_found' }
  if (row.usedAt) return { valid: false, reason: 'used' }
  if (row.expiresAt.getTime() < Date.now()) return { valid: false, reason: 'expired' }
  return { valid: true, userId: row.userId }
}

export async function consumePasswordSetToken(rawToken: string): Promise<TokenCheck> {
  const result = await checkPasswordSetToken(rawToken)
  if (!result.valid) return result

  await db()
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.tokenHash, hashToken(rawToken)))

  return result
}
