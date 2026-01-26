import { defineStore } from 'pinia'
import { Chat } from '@ai-sdk/vue'
import { ref, computed } from 'vue'
import { chatService } from '@/api/services/chat'
import { compressImage } from '@/lib/imageUtils'

export const useChatStore = defineStore('chat', () => {
  const input = ref('')
  
  const chat = new Chat({
    id: 'animake-chat',
    onFinish: (message) => {
      console.log('Chat finished:', message)
    },
    onError: (err) => {
      console.error('Chat error:', err)
    },
  })

  // Local messages state for image generation interactions
  const localMessages = ref<any[]>([])

  // Computed properties to expose chat state
  const messages = computed(() => {
    const chatMessages = chat.messages.map(m => ({
      ...m,
      content: m.parts.filter(p => p.type === 'text').map(p => (p as any).text).join(''),
      // Remove createdAt access if it causes issues, or cast if we are sure
      createdAt: (m as any).createdAt || new Date(),
    }))
    
    // Merge and sort by date
    return [...chatMessages, ...localMessages.value].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  })

  const error = computed(() => chat.error)
  const isLoading = computed(() => chat.status === 'streaming' || chat.status === 'submitted')
  
  const generateImage = async (prompt: string, image?: string) => {
    try {
      // Strip prefix if it exists: "data:image/jpeg;base64,XXXX" -> "XXXX"
      const base64Data = image?.includes('base64,') 
        ? image.split('base64,')[1] 
        : image;

      const response = await chatService.generateImage(prompt, base64Data)
      return `data:${response.mimeType};base64,${response.data}`
    } catch (err) {
      console.error('Failed to generate image:', err)
      throw err
    }
  }

  const handleSubmit = async (e?: Event) => {
    if (e) e.preventDefault()
    if (!input.value.trim()) return

    const value = input.value
    input.value = ''

    // Add user message locally
    localMessages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: value,
      createdAt: new Date(),
      parts: [{ type: 'text', text: value }] // For consistency
    })

    // Generate image
    try {
      // Find the last generated image to use as context for editing
      const lastImageMessage = [...localMessages.value]
        .reverse()
        .find(m => m.role === 'assistant' && m.image)
      
      const lastImage = lastImageMessage?.image
      
      let imageToSend = lastImage
      if (lastImage) {
        try {
          // Compress the image before sending to avoid payload size limits
          imageToSend = await compressImage(lastImage)
        } catch (e) {
          console.warn('Failed to compress image, sending original:', e)
        }
      }

      const imageUrl = await generateImage(value, imageToSend)
      
      // Add assistant message with image locally
      localMessages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Here is your generated image:', // Fallback text
        image: imageUrl, // Custom property for UI
        createdAt: new Date(),
        parts: [{ type: 'text', text: 'Image generated' }]
      })
    } catch (error) {
       localMessages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I failed to generate the image.',
        createdAt: new Date(),
        parts: [{ type: 'text', text: 'Image generation failed.' }]
      })
    }
  }

  const reload = () => chat.regenerate()
  const stop = () => chat.stop()

  return {
    messages,
    input,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    generateImage,
  }
})
