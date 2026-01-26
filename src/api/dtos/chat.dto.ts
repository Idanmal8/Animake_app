export interface GenerateImageRequest {
  prompt: string
  image?: string // Base64 string of the image to edit
}

export interface GenerateVideoRequest {
  prompt: string
  image: string // Base64 string
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
