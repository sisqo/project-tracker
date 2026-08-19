import type { NextAuthConfig } from 'next-auth'

/**
 * The edge-safe part of the auth config — the middleware runs on the edge, so
 * this file must stay free of anything Node-only (bcrypt, the db client). The
 * provider list is filled in `auth.ts`, the only place that needs it.
 */
export const authConfig = {
  providers: [],
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
} satisfies NextAuthConfig
