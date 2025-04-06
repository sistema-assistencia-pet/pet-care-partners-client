'use client'

import axios from 'axios'
import { parseCookies } from 'nookies'

import { endSession } from './auth'
import { UserLogged } from '@/lib/interfaces'

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PET_CARE_API_BASE_URL
})

const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_PET_CARE_PARTNER_SESSION_COOKIE_NAME as string

const cookies = parseCookies()

const userStringfied: string | undefined = cookies[SESSION_COOKIE_NAME]

if (userStringfied) {
  const user = JSON.parse(userStringfied) as UserLogged & { accessToken: string }

  httpClient.interceptors.request.use((request) => {
    request.headers['Authorization'] = `Bearer ${user.accessToken}`
    return request
  })
}

httpClient.interceptors.response.use((response) => {
  if (response.status === 401) endSession()
  return response
})
