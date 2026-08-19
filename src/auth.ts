import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { eq } from 'drizzle-orm'

import { authConfig } from './auth.config'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { verifyAgainstNothing, verifyPassword } from '@/lib/auth/password'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const email = typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : ''
        const password = typeof raw?.password === 'string' ? raw.password : ''
        if (email === '' || password === '') return null

        const [user] = await db().select().from(users).where(eq(users.email, email)).limit(1)

        // No account, no password set yet (first access pending), or a
        // deactivated account: same outcome and same timing either way — the
        // login form must not reveal which case it was.
        if (!user || !user.passwordHash || !user.isActive) {
          await verifyAgainstNothing(password)
          return null
        }

        if (!(await verifyPassword(password, user.passwordHash))) return null

        return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
})
