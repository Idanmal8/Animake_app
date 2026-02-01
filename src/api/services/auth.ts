import { httpClient } from '../httpClient'

export const authService = {
    login: (credentials: { email: string; password: string }) => {
        return httpClient.post<{ access_token: string; user: { id: number; email: string } }>('/auth/login', credentials)
    },
}
