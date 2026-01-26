import { httpClient } from '../httpClient'
import type { GenerateImageRequest, GenerateImageResponse, ChatRequest, ChatResponse } from '../dtos/chat.dto'

export const chatService = {
  generateImage: (prompt: string, image?: string) => {
    const request: GenerateImageRequest = { prompt, image }
    return httpClient.post<GenerateImageResponse>('/chat/generate', request)
  },

  sendMessage: (message: string) => {
    const request: ChatRequest = { message }
    return httpClient.post<ChatResponse>('/chat', request)
  },
}
