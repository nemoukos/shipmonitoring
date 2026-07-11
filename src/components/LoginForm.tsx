'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import type { ApiSession } from '@/lib/clientApi'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const nextPath = searchParams.get('next') ?? '/dashboard'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      setError(data.error ?? 'Unable to sign in.')
      return
    }

    const session = (await response.json()) as ApiSession

    login(session)
    router.push(nextPath)
    router.refresh()
  }

  return (
    <form
      className="grid w-full max-w-sm gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
      onSubmit={handleSubmit}
    >
      <div>
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in before viewing ship data.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 rounded-md border border-[var(--border)] bg-slate-950 px-3 text-white outline-none transition focus:border-cyan-300"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-md border border-[var(--border)] bg-slate-950 px-3 text-white outline-none transition focus:border-cyan-300"
        />
      </label>

      {error && (
        <p className="rounded-md border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-md bg-cyan-400 px-4 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
