'use client'

import { useEffect } from 'react'
import LoginForm from './modules/login-form'
import { destroyCookie } from 'nookies'

export default function LoginPage() {
  const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME as string

  useEffect(
    () => {
      destroyCookie(null, SESSION_COOKIE_NAME)
    }, []
  )

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <LoginForm />
    </main>
  )
}