'use server'

import { AuthError } from 'next-auth'

import { signIn } from '@/auth'

export type LoginState = { error: string } | undefined

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirectTo') ?? '/')

  try {
    await signIn('credentials', { email, password, redirectTo })
    return undefined
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email o password non corretti.' }
    }
    throw error
  }
}
