import { httpClient } from '../httpClient'

export const vectorizationService = {
    traceFrame: (file: Blob) => {
        const formData = new FormData()
        formData.append('file', file)
        return httpClient.postFormData<any[]>('/vectorize', formData)
    }
}
