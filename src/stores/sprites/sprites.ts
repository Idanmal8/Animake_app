import { defineStore } from 'pinia'
import { ref } from 'vue'

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

    return {
        isProcessing,
        generateSpriteSheet,
    }
})
