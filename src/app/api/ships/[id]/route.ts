import { NextRequest, NextResponse } from 'next/server'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const apiResponse = await fetch(`${apiBaseUrl}/api/ships/${id}`, {
    cache: 'no-store',
    headers: {
      Authorization: request.headers.get('authorization') ?? '',
    },
  })
  const data = await apiResponse.json()

  return NextResponse.json(data, { status: apiResponse.status })
}
