import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ToastType } from '@/components/toasts/enums'

export const useToastStore = defineStore('toast', () => {
  const visible = ref(false)
  const title = ref('')
  const message = ref('')
  const type = ref<ToastType>(ToastType.Info)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const show = (
    newTitle: string,
    newMessage: string,
    newType: ToastType = ToastType.Info,
    duration = 3000,
  ) => {
    title.value = newTitle
    message.value = newMessage
    type.value = newType
    visible.value = true

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  const hide = () => {
    visible.value = false
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  // Rate Limit Modal State
  const isRateLimitModalVisible = ref(false)
  const rateLimitRetryAfter = ref<string | number>(0)

  const showRateLimitModal = (retryAfter: string | number) => {
    rateLimitRetryAfter.value = retryAfter
    isRateLimitModalVisible.value = true
  }

  const hideRateLimitModal = () => {
    isRateLimitModalVisible.value = false
  }

  return {
    visible,
    title,
    message,
    type,
    show,
    hide,
    isRateLimitModalVisible,
    rateLimitRetryAfter,
    showRateLimitModal,
    hideRateLimitModal,
  }
})
