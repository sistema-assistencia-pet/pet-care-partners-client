'use server'

import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'

import { AccessTokenPayload, SessionData, UserLogged } from './interfaces'

const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_PET_CARE_PARTNER_SESSION_COOKIE_NAME as string

export async function openAccessToken(accessToken: string): Promise<AccessTokenPayload> {
  const secret = new TextEncoder().encode(process.env.PET_CARE_JWT_SECRET)
  const { payload }: { payload: AccessTokenPayload } = await jwtVerify(accessToken, secret)

  return payload
}

export async function validateSession(): Promise<boolean> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)
  if (!sessionCookie) return false

  try {
    const sessionData: SessionData = JSON.parse(sessionCookie.value)
    if (!('accessToken' in sessionData)) return false

    const { exp: expires } = await openAccessToken(sessionData.accessToken)

    const currentDate = new Date().getTime()

    return (expires as number) * 1000 > currentDate
  } catch (error) {
    return false
  }
}

export async function createSession(accessToken: string, user: UserLogged): Promise<void> {
  cookies().set(
    SESSION_COOKIE_NAME,
    JSON.stringify({ accessToken, user }),
    {
      maxAge: 60 * 60 * 2,
      path: '/',
      sameSite: 'strict'
    }
  )
}

export async function endSession(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME)

  redirect('/login')
}
