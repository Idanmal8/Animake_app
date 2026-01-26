import { API_BASE_URL } from './config'

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>
    responseType?: 'json' | 'text'
}

class HttpClient {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        }

        const token = localStorage.getItem('token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const config: RequestInit = {
            ...options,
            headers,
        }

        console.log('Request Headers:', headers)

        try {
            console.log('API Request:', url, config.method, config.body)
            const response = await fetch(url, config)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('API Error Response:', errorText)
                throw new Error(`HTTP Error: ${response.status} ${response.statusText} - ${errorText}`)
            }

            // Handle empty responses (e.g., 204 No Content)
            if (response.status === 204) {
                return {} as T
            }

            const responseType = options.responseType || 'json'
            return responseType === 'json' ? await response.json() : await response.text() as unknown as T
        } catch (error) {
            console.error('API Request Failed:', error)
            throw error
        }
    }

    get<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: 'GET' })
    }

    post<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        })
    }

    postText<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
            responseType: 'text'
        })
    }

    put<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        })
    }

    patch<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        })
    }

    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' })
    }
}

export const httpClient = new HttpClient()
