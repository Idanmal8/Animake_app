import { API_BASE_URL } from './config'

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>
    responseType?: 'json' | 'text'
}

class HttpClient {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`

        const headers: Record<string, string> = {
            // Default to json, but allow overriding/removing by passing null or different value
            'Content-Type': 'application/json',
            ...options.headers,
        }
        
        // If Content-Type is set to 'undefined' string or null by caller, delete it
        // Note: In TS Record<string, string>, strictly we expect strings.
        // But we can check if the key exists and if we want to remove it.
        // Actually, easiest way: if body is FormData, remove Content-Type.
        
        if (options.body instanceof FormData) {
            delete headers['Content-Type']
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

    postFormData<T>(endpoint: string, formData: FormData, options?: RequestOptions) {
        // Headers are handled tricky here. If we set Content-Type to multipart/form-data manually,
        // we lose the boundary. We must NOT set it.
        // But request() sets 'Content-Type': 'application/json' by default.
        // We need a way to bypass that.
        
        const { headers, ...restOptions } = options || {}
        
        return this.request<T>(endpoint, {
            ...restOptions,
            headers: {
                ...headers,
                // Explicitly remove Content-Type to let browser handle it (with boundary)
                // However, our request() method forces application/json. 
                // We need to modify request() to respect an overwrite or null.
            },
            method: 'POST',
            body: formData,
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
