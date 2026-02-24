import { defineStore } from 'pinia'
import { ref } from 'vue'
import { httpClient } from '@/api/httpClient'
import { useToastStore } from '@/stores/toast/toast'
import { ToastType } from '@/components/toasts/enums'

export const useFeedbackStore = defineStore('feedback', () => {
  const isSending = ref(false)
  const toastStore = useToastStore()

  const sendFeedback = async (name: string, email: string, message: string) => {
    isSending.value = true
    try {
      await httpClient.post('/feedback', {
        name,
        email,
        message,
      })
      toastStore.show('Success', 'Your message has been sent!', ToastType.Success)
      return true
    } catch (error) {
      toastStore.show('Error', 'Failed to send message. Please try again later.', ToastType.Error)
      console.error('Feedback error:', error)
      return false
    } finally {
      isSending.value = false
    }
  }

  return {
    isSending,
    sendFeedback,
  }
})
