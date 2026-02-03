import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCanvasPickerStore = defineStore('canvasPicker', () => {
    // Standard pixel art sizes (presets)
    const availableSizes = [24, 32, 48, 64, 128, 256, 512, 1024]
    
    // Dimensions
    const width = ref<number>(64)
    const height = ref<number>(64)

    const setSize = (w: number, h: number) => {
        width.value = w
        height.value = h
    }

    return {
        availableSizes,
        width,
        height,
        setSize
    }
})
