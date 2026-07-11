'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { ApiSession, ApiUser } from '@/lib/clientApi'

const storageKey = 'ship-monitor-session'

type AuthContextValue = {
  token: string | null
  user: ApiUser | null
  isReady: boolean
  login: (session: ApiSession) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<ApiUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const savedSession = window.sessionStorage.getItem(storageKey)

    if (savedSession) {
      try {
        const session = JSON.parse(savedSession) as ApiSession

        window.setTimeout(() => {
          setToken(session.token)
          setUser(session.user)
        }, 0)
      } catch {
        window.sessionStorage.removeItem(storageKey)
      }
    }

    window.setTimeout(() => {
      setIsReady(true)
    }, 0)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isReady,
      login(session) {
        window.sessionStorage.setItem(storageKey, JSON.stringify(session))
        setToken(session.token)
        setUser(session.user)
      },
      logout() {
        window.sessionStorage.removeItem(storageKey)
        setToken(null)
        setUser(null)
      },
    }),
    [isReady, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
