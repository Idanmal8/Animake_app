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

  const generateFrames = async (excludedIntervals: {start: number, end: number}[] = []) => {
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

    // Crop Logic
    const isCropped = uploadStore.isCropped
    const cropOffset = uploadStore.cropOffset
    
    let sourceX = 0
    let sourceY = 0
    let sourceWidth = video.videoWidth
    let sourceHeight = video.videoHeight
    
    // If cropping is enabled and video is wider than tall (Landscape)
    if (isCropped && sourceWidth > sourceHeight) {
        // 1:1 Crop
        sourceWidth = sourceHeight // Square
        const maxOffset = video.videoWidth - sourceWidth
        sourceX = maxOffset * (cropOffset / 100)
    } 
    // Handle Portrait? (height > width). Usually just center crop or top/bottom?
    // User asked for 16:9 to 1:1, implying landscape loop.
    // For now, only crop landscape.
    
    // Canvas Size
    canvas.width = sourceWidth
    canvas.height = sourceHeight

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

        // Draw cropped region
        ctx.drawImage(
            video, 
            sourceX, sourceY, sourceWidth, sourceHeight, // Source
            0, 0, canvas.width, canvas.height            // Destination
        )
        
        // Determine selection status
        let isSelected = true
        if (excludedIntervals.length > 0) {
            const frameStart = currentTime
            const frameEnd = currentTime + interval
            const frameCenter = frameStart + (interval / 2)
            
            // Check if this frame center falls into any excluded interval
            // Simple check: if the center of the new frame was "excluded" in the old timeline
            const isExcluded = excludedIntervals.some(ex => frameCenter >= ex.start && frameCenter < ex.end)
            if (isExcluded) isSelected = false
        }
        
        // Save
        frames.value.push({
            id: frameId,
            dataUrl: canvas.toDataURL('image/jpeg', 0.7), // Compress slightly
            timestamp: currentTime,
            selected: isSelected
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
    // 1. Calculate currently excluded time intervals
    // We assume each frame covers [timestamp, timestamp + 1/oldFps)
    const oldInterval = 1 / fps.value
    const excludedIntervals: {start: number, end: number}[] = []
    
    frames.value.forEach(f => {
        if (!f.selected) {
            excludedIntervals.push({
                start: f.timestamp,
                end: f.timestamp + oldInterval
            })
        }
    })

    fps.value = newFps
    // 2. Regenerate frames passing the exclusions
    generateFrames(excludedIntervals)
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
