import { NextRequest, NextResponse } from 'next/server'

const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'ship_session'
const protectedRoutes = ['/dashboard', '/map', '/3d', '/ships']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute =
    pathname === '/' ||
    protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value)

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)

    return NextResponse.redirect(loginUrl)
  }

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
