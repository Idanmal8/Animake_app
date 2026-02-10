import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVideoUploadStore = defineStore('videoUpload', () => {
  const videoFile = ref<File | null>(null)
  const thumbnailUrl = ref<string | null>(null)

  // Trimming State
  const duration = ref(0)
  const startTime = ref(0)
  const endTime = ref(0)
  const isPlayingPreview = ref(false)

  // Cropping State
  const isCropped = ref(false) // Toggle 1:1 crop
  const cropOffset = ref(50) // 0 = Left, 50 = Center, 100 = Right

  const uploadVideo = (file: File) => {
    // Revoke previous URL if exists to prevent memory leaks
    if (thumbnailUrl.value) {
      URL.revokeObjectURL(thumbnailUrl.value)
    }

    videoFile.value = file
    // Create a local preview URL
    thumbnailUrl.value = URL.createObjectURL(file)

    // Reset trim state
    duration.value = 0
    startTime.value = 0
    endTime.value = 0
    isPlayingPreview.value = false
  }

  const setDuration = (seconds: number) => {
    duration.value = seconds
    // Default to full duration if not set
    if (endTime.value === 0) {
      endTime.value = Math.min(seconds, 3)
    }
  }

  const setTrim = (start: number, end: number) => {
    startTime.value = start
    endTime.value = end
  }

  const togglePreview = (msg?: boolean) => {
    isPlayingPreview.value = msg !== undefined ? msg : !isPlayingPreview.value
  }

  const reset = () => {
    if (thumbnailUrl.value) {
      URL.revokeObjectURL(thumbnailUrl.value)
    }
    videoFile.value = null
    thumbnailUrl.value = null
    duration.value = 0
    startTime.value = 0
    endTime.value = 0
    isPlayingPreview.value = false
  }

  return {
    videoFile,
    thumbnailUrl,
    duration,
    startTime,
    endTime,
    isPlayingPreview,
    isCropped,
    cropOffset,
    uploadVideo,
    setDuration,
    setTrim,
    togglePreview,
    reset,
  }
})
