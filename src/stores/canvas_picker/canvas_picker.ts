import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCanvasPickerStore = defineStore('canvasPicker', () => {
    // Standard pixel art sizes
    const availableSizes = [24, 32, 48, 64, 128, 256, 512, 1024]
    
    // Default selection
    const selectedSize = ref<number>(64)

    const setSize = (size: number) => {
        selectedSize.value = size
    }

    return {
        availableSizes,
        selectedSize,
        setSize
    }
})
