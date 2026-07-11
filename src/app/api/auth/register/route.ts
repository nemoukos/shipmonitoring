import { NextRequest, NextResponse } from 'next/server'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'
type RegisterResponse = {
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
  const apiResponse = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const data = (await apiResponse.json()) as RegisterResponse

  if (!apiResponse.ok || !data.token) {
    return NextResponse.json(
      { error: data.error ?? 'Registration failed.' },
      { status: apiResponse.status }
    )
  }

  return NextResponse.json({ token: data.token, user: data.user })
}
