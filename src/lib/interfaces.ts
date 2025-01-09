import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'
import { JWTPayload } from 'jose'

export interface SuccessResponse<D> {
  data: D
  error: false
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders & Record<'string', 'string'>
  message: string
}

export interface FailResponse {
  error: true
  message: string
}

export interface SessionData {
  user: UserLogged
  accessToken: string
}

export interface UserLogged {
  id: string
  name: string
  roleId: number
  client: {
    id: string
    fantasyName: string
  } | null
}

export type AccessTokenPayload = JWTPayload & UserLogged
