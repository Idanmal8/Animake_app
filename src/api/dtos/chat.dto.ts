export interface GenerateImageRequest {
  prompt: string
}

export interface GenerateImageResponse {
  data: string // base64
  mimeType: string
}

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  response: string
}
