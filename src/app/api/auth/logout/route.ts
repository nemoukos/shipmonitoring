import { NextResponse } from 'next/server'

const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'ship_session'

export async function POST() {
  const response = NextResponse.json({ ok: true })

  response.cookies.delete(sessionCookieName)

  return response
}
