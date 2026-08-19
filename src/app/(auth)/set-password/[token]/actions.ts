'use server'

import { eq } from 'drizzle-orm'
import { AuthError } from 'next-auth'

import { signIn } from '@/auth'
import { consumePasswordSetToken } from '@/lib/auth/password-reset'
import { hashPassword } from '@/lib/auth/password'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

export type SetPasswordState = { error: string } | undefined

export async function setPasswordAction(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (password.length < 8) {
    return { error: 'La password deve avere almeno 8 caratteri.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Le due password non coincidono.' }
  }

  const result = await consumePasswordSetToken(token)
  if (!result.valid) {
    return { error: 'Questo link non è più valido: è già stato usato, è scaduto, oppure non esiste.' }
  }

  const passwordHash = await hashPassword(password)
  await db().update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, result.userId))

  const [user] = await db().select().from(users).where(eq(users.id, result.userId)).limit(1)
  if (!user) return { error: 'Utente non trovato.' }

  try {
    await signIn('credentials', { email: user.email, password, redirectTo: '/' })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Password impostata, ma l\'accesso automatico è fallito: accedi dalla pagina di login.' }
    }
    throw error
  }
}
