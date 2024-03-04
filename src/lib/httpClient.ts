'use client'

import { UserLogged } from '@/lib/interfaces'
import axios from 'axios'
import { parseCookies } from 'nookies'

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL
})

const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME as string

const cookies = parseCookies()

const userStringfied: string | undefined = cookies[SESSION_COOKIE_NAME]

if (userStringfied) {
  const user = JSON.parse(userStringfied) as UserLogged & { accessToken: string }

  httpClient.interceptors.request.use((config) => {
    config.headers['Authorization'] = `Bearer ${user.accessToken}`
    return config
  })
}
