import { httpClient } from '../httpClient'

export const authApi = {
    login: (credentials: { email: string; password: string }) => {
        return httpClient.post<{ token: string }>('/auth/login', credentials)
    },
}
