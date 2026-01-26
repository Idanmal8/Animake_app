import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatService } from '@/api/services/chat'
import { compressImage } from '@/lib/imageUtils'

export interface VideoMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    video?: string // URL
    createdAt: Date
    // AI SDK compat
    parts?: any[]
}

export const useVideoStore = defineStore('video', () => {
    const selectedImage = ref<string | null>(null)
    const messages = ref<VideoMessage[]>([])
    const input = ref('')
    const isLoading = ref(false)
    const error = ref<any>(null)

    const setContextImage = (image: string) => {
        selectedImage.value = image
        // Reset chat when new context is set
        messages.value = []
    }

    const generateVideo = async (prompt: string) => {
        if (!selectedImage.value) {
            console.error('No context image selected for video generation')
            return
        }
        
        const contextImage = selectedImage.value // Capture non-null value

        isLoading.value = true
        error.value = null

        try {
            // Compress image before sending
            let base64Image = contextImage
            try {
                 base64Image = await compressImage(contextImage)
                 // Strip prefix if present
                 if (base64Image.includes('base64,')) {
                    base64Image = base64Image.split('base64,')[1] || base64Image
                 }
            } catch (e) {
                console.warn('Compression failed, using original', e)
                // Use original but strip prefix
                 if (base64Image.includes('base64,')) {
                    base64Image = base64Image.split('base64,')[1] || base64Image
                 }
            }
            
            let videoUrl = await chatService.generateVideo(prompt, base64Image)
            
            // TEMPORARY: Append API Key to authorize browser access
             const API_KEY = import.meta.env.GEMINI_API_KEY
             if (API_KEY) {
                 videoUrl += (videoUrl.includes('?') ? '&' : '?') + 'key=' + API_KEY
             }

            try {
                // Attempt to fetch as blob to prevent playback issues with direct API URLs
                const response = await fetch(videoUrl)
                if (response.ok) {
                    const blob = await response.blob()
                    return URL.createObjectURL(blob)
                }
            } catch (e) {
                console.warn('Failed to fetch video blob, using direct URL:', e)
            }

            return videoUrl
        } catch (err) {
            console.error('Video generation failed:', err)
            error.value = err
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const handleSubmit = async (e?: Event) => {
        if (e) e.preventDefault()
        if (!input.value.trim() || !selectedImage.value) return

        const prompt = input.value
        input.value = ''

        // Add user message
        messages.value.push({
            id: crypto.randomUUID(),
            role: 'user',
            content: prompt,
            createdAt: new Date(),
            parts: [{ type: 'text', text: prompt }]
        })

        // Add temporary loading message or handle loading state in UI
        // We'll let UI handle loading state via isLoading, but usually chat apps show "Generating..."
        // For simplicity, we wait.

        try {
            const videoUrl = await generateVideo(prompt)
            
            // Add assistant video message
            messages.value.push({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Here is your video:',
                video: videoUrl,
                createdAt: new Date(),
                parts: [{ type: 'text', text: 'Video generated' }]
            })
        } catch (err) {
             messages.value.push({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Sorry, video generation failed.',
                createdAt: new Date(),
                parts: [{ type: 'text', text: 'Video generation failed' }]
            })
        }
    }

    return {
        selectedImage,
        messages,
        input,
        isLoading,
        error,
        setContextImage,
        generateVideo,
        handleSubmit
    }
})
