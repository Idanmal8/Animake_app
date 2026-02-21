import { httpClient } from '../httpClient'

export const authService = {
  login: (credentials: { email: string; password: string }) => {
    return httpClient.post<{ access_token: string; user: { id: number; email: string } }>(
      '/auth/login',
      credentials,
    )
  },
  register: (userData: { email: string; fullName: string; password: string }) => {
    return httpClient.post<{ id: number; email: string; fullName: string }>('/users', userData)
  },
  refresh: () => {
    return httpClient.post<{ access_token: string; user: { id: number; email: string } }>(
      '/auth/refresh',
      {},
    )
  },
}
