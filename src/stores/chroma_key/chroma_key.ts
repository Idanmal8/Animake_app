import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useVideoFramesStore, type Frame } from '@/stores/video_frames/video_frames'

export const useChromaKeyStore = defineStore('chromaKey', () => {
    const framesStore = useVideoFramesStore()
    
    // Default green screen color
    const targetColor = ref('#00FF00')
    const tolerance = ref(10) // 0-100
    const isProcessing = ref(false)
    
    // We might need to store processed versions of frames, 
    // or apply the filter live on the canvas during render to save memory.
    // For now, let's apply it live in the computed/preview to allow instant feedback.
    
    const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1] || '0', 16),
            g: parseInt(result[2] || '0', 16),
            b: parseInt(result[3] || '0', 16)
        } : { r: 0, g: 0, b: 0 }
    }

    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h * 360, s * 100, l * 100];
    }

    // Function to process a single image data context
    const processFrameData = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const frameData = ctx.getImageData(0, 0, width, height)
        const data = frameData.data
        const len = data.length
        
        const targetRgb = hexToRgb(targetColor.value)
        const targetHsl = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b)
        
        // Tolerance threshold
        const tol = tolerance.value
        
        for (let i = 0; i < len; i += 4) {
            const r = data[i] ?? 0
            const g = data[i + 1] ?? 0
            const b = data[i + 2] ?? 0
            
            // Simple RGB distance or HSL distance can be used. 
            // HSL is often better for green screen but RGB is faster.
            // Let's stick to a simple Euclidean RGB distance for performance first.
            const distance = Math.sqrt(
                Math.pow(r - targetRgb.r, 2) +
                Math.pow(g - targetRgb.g, 2) +
                Math.pow(b - targetRgb.b, 2)
            )

            // Normalize distance (max distance is sqrt(3 * 255^2) approx 441)
            if (distance < (tol * 4.41)) {
                data[i + 3] = 0 // Transparent
            }
        }
        
        ctx.putImageData(frameData, 0, 0)
    }

    return {
        targetColor,
        tolerance,
        isProcessing,
        processFrameData
    }
})
