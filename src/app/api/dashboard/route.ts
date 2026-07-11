import { NextRequest, NextResponse } from 'next/server'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const apiUrl = new URL('/api/dashboard', apiBaseUrl)
  const shipId = url.searchParams.get('shipId')

  if (shipId) {
    apiUrl.searchParams.set('shipId', shipId)
  }

  const apiResponse = await fetch(apiUrl, {
    cache: 'no-store',
    headers: {
      Authorization: request.headers.get('authorization') ?? '',
    },
  })
  const data = await apiResponse.json()

  return NextResponse.json(data, { status: apiResponse.status })
}
