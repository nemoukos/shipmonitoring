import LoginForm from '@/components/LoginForm'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
