import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { Ship } from '@/types/ship'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'ship_session'

type ShipsResponse = {
  ships: Ship[]
}

type ShipResponse = {
  ship: Ship
}

async function authenticatedApiFetch(path: string) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(sessionCookieName)

  if (!sessionCookie) {
    redirect('/login')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    headers: {
      Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
    },
  })

  if (response.status === 401) {
    redirect('/login')
  }

  return response
}

export async function getShips() {
  const response = await authenticatedApiFetch('/api/ships')

  if (!response.ok) {
    throw new Error('Unable to load ships from the API.')
  }

  const data = (await response.json()) as ShipsResponse

  return data.ships
}

export async function getShipById(id: string) {
  const response = await authenticatedApiFetch(`/api/ships/${id}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Unable to load ship from the API.')
  }

  const data = (await response.json()) as ShipResponse

  return data.ship
}
