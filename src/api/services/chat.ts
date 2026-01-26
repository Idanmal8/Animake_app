import { httpClient } from '../httpClient'
import type { GenerateImageRequest, GenerateImageResponse, ChatRequest, ChatResponse, GenerateVideoRequest } from '../dtos/chat.dto'

export const chatService = {
  generateImage: (prompt: string, image?: string) => {
    const request: GenerateImageRequest = { prompt, image }
    return httpClient.post<GenerateImageResponse>('/chat/generate', request)
  },

  generateVideo: (prompt: string, image: string) => {
     const request: GenerateVideoRequest = { prompt, image }
     // Use postText since the response is a direct string URL
     return httpClient.postText<string>('/chat/generate-video', request)
  },

  sendMessage: (message: string) => {
    const request: ChatRequest = { message }
    return httpClient.post<ChatResponse>('/chat', request)
  },
}
