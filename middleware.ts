import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const protectedRoutes = [
    '/dashboard',
    '/service-selection',
    '/interview-session',
    '/communication-practice',
    '/feedback',
  ]

  // If the user is not signed in and is trying to access a protected route,
  // redirect them to the login page.
  if (!session && protectedRoutes.some(path => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}