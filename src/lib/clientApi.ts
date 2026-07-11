export type ApiUser = {
  id: number
  email: string
  name: string
}

export type ApiSession = {
  token: string
  user: ApiUser
}

export async function apiFetch(
  path: string,
  token: string,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers)

  headers.set('Authorization', `Bearer ${token}`)

  return fetch(path, {
    ...init,
    headers,
  })
}
