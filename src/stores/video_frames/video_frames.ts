import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useVideoUploadStore } from '@/stores/video_upload/video_upload'

export interface Frame {
  id: number
  dataUrl: string
  timestamp: number
  selected: boolean
}

export const useVideoFramesStore = defineStore('videoFrames', () => {
  const uploadStore = useVideoUploadStore()
  
  const frames = ref<Frame[]>([])
  const fps = ref(24)
  const zoomLevel = ref(1) // 1x to 5x?
  const isGenerating = ref(false)
  const isPlaying = ref(false)
  const currentPreviewFrame = ref(0) // Index of frame being shown in preview

  const selectedFrames = computed(() => frames.value.filter(f => f.selected))

  const generateFrames = async () => {
    if (!uploadStore.videoFile) return

    isGenerating.value = true
    frames.value = [] // Clear previous
    
    const video = document.createElement('video')
    video.src = uploadStore.thumbnailUrl || URL.createObjectURL(uploadStore.videoFile)
    video.muted = true
    video.playsInline = true
    
    await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true)
    })

    const start = uploadStore.startTime
    const end = uploadStore.endTime > 0 ? uploadStore.endTime : video.duration
    const duration = end - start
    const interval = 1 / fps.value
    const totalFrames = Math.floor(duration * fps.value)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        isGenerating.value = false
        return
    }

    // Set canvas dimensions to match video (or scaled down for performance?)
    // Using full resolution for now, can optimize later
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    let currentTime = start
    let frameId = 0

    const processFrame = async () => {
        if (currentTime >= end || frameId >= totalFrames) {
             isGenerating.value = false
             return
        }

        // Seek
        video.currentTime = currentTime
        
        await new Promise(r => {
             // We need to wait for seek to finish. 
             // 'seeked' event is reliable.
             const onSeeked = () => {
                 video.removeEventListener('seeked', onSeeked)
                 r(true)
             }
             video.addEventListener('seeked', onSeeked)
        })

        // Draw
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Save
        frames.value.push({
            id: frameId,
            dataUrl: canvas.toDataURL('image/jpeg', 0.7), // Compress slightly
            timestamp: currentTime,
            selected: true // Default select all?
        })

        currentTime += interval
        frameId++

        // Process next frame (non-blocking UI)
        requestAnimationFrame(processFrame)
    }

    // Start processing
    processFrame()
  }

  const toggleFrame = (id: number) => {
    const frame = frames.value.find(f => f.id === id)
    if (frame) {
      frame.selected = !frame.selected
    }
  }

  const selectAll = () => {
    frames.value.forEach(f => f.selected = true)
  }

  const selectNone = () => {
    frames.value.forEach(f => f.selected = false)
  }
  
  const setFps = (newFps: number) => {
    fps.value = newFps
    // Regenerate frames when FPS changes
    generateFrames()
  }

  return {
    frames,
    fps,
    zoomLevel,
    isGenerating,
    isPlaying,
    currentPreviewFrame,
    selectedFrames,
    generateFrames,
    toggleFrame,
    selectAll,
    selectNone,
    setFps
  }
})
