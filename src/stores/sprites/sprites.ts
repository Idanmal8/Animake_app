import { defineStore } from 'pinia'
import { ref } from 'vue'
import { httpClient } from '@/api/httpClient'

export const useSpritesStore = defineStore('sprites', () => {
    const isProcessing = ref(false)

    /**
     * Generates a single Sprite Sheet image from an array of frame data.
     * Returns:
     * - imageUrl: The Data URL of the sprite sheet
     * - metadata: Info about grid size, frame counts, etc.
     */
    const generateSpriteSheet = async (framesData: ImageData[], fps: number): Promise<{ imageUrl: string, metadata: any }> => {
        if (framesData.length === 0) throw new Error("No frames to generate sprite sheet")

        const frameWidth = framesData[0]!.width
        const frameHeight = framesData[0]!.height
        const totalFrames = framesData.length

        // Calculate optimal Grid (try to be square)
        const cols = Math.ceil(Math.sqrt(totalFrames))
        const rows = Math.ceil(totalFrames / cols)

        const sheetWidth = cols * frameWidth
        const sheetHeight = rows * frameHeight

        const canvas = document.createElement('canvas')
        canvas.width = sheetWidth
        canvas.height = sheetHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error("Canvas context creation failed")

        // Draw frames
        // Use a temporary canvas to convert ImageData to ImageBitmap/Drawable
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = frameWidth
        tempCanvas.height = frameHeight
        const tempCtx = tempCanvas.getContext('2d')
        
        if (!tempCtx) throw new Error("Temp Canvas context failed")

        for (let i = 0; i < totalFrames; i++) {
            const col = i % cols
            const row = Math.floor(i / cols)
            
            const x = col * frameWidth
            const y = row * frameHeight

            tempCtx.putImageData(framesData[i]!, 0, 0)
            ctx.drawImage(tempCanvas, x, y)
        }

        const dataUrl = canvas.toDataURL("image/png")
        
        const metadata = {
            fps,
            totalFrames,
            cols,
            rows,
            frameWidth,
            frameHeight,
            sheetWidth,
            sheetHeight
        }

        return { imageUrl: dataUrl, metadata }
    }

    const generateSpriteSheetBackend = async (
        frames: { dataUrl: string }[], 
        width: number, 
        height: number, 
        fps: number,
        targetColor: string, 
        tolerance: number
    ): Promise<{ imageUrl: string, metadata: any }> => {
        isProcessing.value = true
        try {
            const formData = new FormData()
            formData.append('width', width.toString())
            formData.append('height', height.toString())
            formData.append('fps', fps.toString())
            formData.append('targetColor', targetColor)
            formData.append('tolerance', tolerance.toString())

            // Convert DataURLs to Blobs (fetch all first to preserve order)
            const blobs = await Promise.all(frames.map(async (frame) => {
                const res = await fetch(frame.dataUrl)
                return await res.blob()
            }))

            // Append ordered blobs
            blobs.forEach((blob, index) => {
                formData.append('files', blob, `frame_${index}.png`)
            })

            const response = await httpClient.postFormData<{ imageUrl: string, metadata: any }>('/sprites/generate', formData)
            return response
        } finally {
            isProcessing.value = false
        }
    }

    return {
        isProcessing,
        generateSpriteSheet,
        generateSpriteSheetBackend
    }
})
