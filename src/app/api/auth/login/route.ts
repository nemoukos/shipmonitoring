import { NextRequest, NextResponse } from 'next/server'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'ship_session'

type LoginResponse = {
  token?: string
  user?: {
    id: number
    email: string
    name: string
  }
  error?: string
}

export async function POST(request: NextRequest) {
  const credentials = await request.json()
  const apiResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })
  const data = (await apiResponse.json()) as LoginResponse

  if (!apiResponse.ok || !data.token) {
    return NextResponse.json(
      { error: data.error ?? 'Login failed.' },
      { status: apiResponse.status }
    )
  }

  const response = NextResponse.json({ user: data.user })

  response.cookies.set(sessionCookieName, data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
