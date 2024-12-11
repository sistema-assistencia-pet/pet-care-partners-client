'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { parseCookies } from 'nookies'

import { createSession } from '@/lib/auth'
import { httpClient } from '@/lib/httpClient'
import { sendRequest } from '@/lib/sendRequest'
import { SessionData, UserLogged } from '@/lib/interfaces'

interface AuthContextType {
  user: UserLogged | null,
  signIn: ({ cpf, password }: { cpf: string, password: string } ) => Promise<void>
}

const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME as string

const AuthContext = createContext<AuthContextType | null>(null)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLogged | null>(null)

  // Recupera dados da sessão dos cookies ao atualizar a página
  useEffect(() => {
    const cookies = parseCookies()
    const sessionDataStringfied = cookies[SESSION_COOKIE_NAME]

    try {
      const { accessToken, user } = JSON.parse(sessionDataStringfied) as SessionData

      setUser(user)

      httpClient.interceptors.request.use((config) => {
        config.headers['Authorization'] = `Bearer ${accessToken}`
        return config
      })
    } catch (error) {}
  }, [])

  async function signIn({ cpf, password }: { cpf: string, password: string }): Promise<void> {
    const response = await sendRequest<{ user: UserLogged }>({
      endpoint: '/auth/user/login',
      method: 'POST',
      data: { cpf: cpf.trim(), password: password.trim() },
    })

    if(response.error) throw new Error(response.message)

    setUser(response.data.user)

    const accessToken = response.headers['access-token']

    if (accessToken) {
      await createSession(accessToken, response.data.user)

      httpClient.interceptors.request.use((config) => {
        config.headers['Authorization'] = `Bearer ${accessToken}`
        return config
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, signIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext) as AuthContextType
}
