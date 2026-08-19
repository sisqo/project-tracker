import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'

import { authConfig } from './auth.config'

/**
 * Edge-safe gate: JWT presence only. Freshness of role/isActive is enforced
 * by `requireUser()` on the server, which hits the database — see
 * lib/auth/current-user.ts.
 */
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  if (!req.auth) {
    const url = new URL('/login', req.url)
    url.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: ['/((?!api/auth|login|set-password|_next/static|_next/image|favicon.ico).*)'],
}
