<script setup lang="ts">
import { useChromaKeyStore } from '@/stores/chroma_key/chroma_key'
import { useVideoFramesStore } from '@/stores/video_frames/video_frames'
import { ref, onMounted, watch, computed } from 'vue'
import { Pipette } from 'lucide-vue-next'
import AppButton from '@/components/buttons/AppButton.vue'

const chromaStore = useChromaKeyStore()
const framesStore = useVideoFramesStore()

const emit = defineEmits<{
  (e: 'continue'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isPickingColor = ref(false)

// We preview the same frame index as the frames slicing view for continuity, 
// or just loop for effect? 
// Let's loop like the preview for better feedback.
const previewInterval = ref<number | null>(null)
const currentFrameIndex = ref(0) // Local or sync with global? Local is fine.

const currentFrameData = computed(() => {
    const selected = framesStore.selectedFrames
    if (selected.length === 0) return null
    if (currentFrameIndex.value >= selected.length) return selected[0]
    return selected[currentFrameIndex.value]
})

const renderFrame = () => {
    if (!canvasRef.value || !currentFrameData.value) return
    
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        // Apply chroma key
        chromaStore.processFrameData(ctx, canvas.width, canvas.height)
    }
    img.src = currentFrameData.value.dataUrl
}

const startPreview = () => {
    stopPreview()
    previewInterval.value = window.setInterval(() => {
        const selected = framesStore.selectedFrames
        if (selected.length === 0) return
        
        let next = currentFrameIndex.value + 1
        if (next >= selected.length) next = 0
        currentFrameIndex.value = next
    }, 1000 / framesStore.fps)
}

const stopPreview = () => {
    if (previewInterval.value) {
        clearInterval(previewInterval.value)
        previewInterval.value = null
    }
}

// Watch for frame changes to re-render
watch(currentFrameIndex, () => {
    renderFrame()
})

// Watch for chroma settings to re-render current frame immediately (even if paused?)
// If playing, it updates naturally. If paused or just strictly reactive:
watch([() => chromaStore.targetColor, () => chromaStore.tolerance], () => {
    renderFrame()
})

onMounted(() => {
    startPreview()
})

const toggleColorPicker = () => {
    isPickingColor.value = !isPickingColor.value
}

const handleCanvasClick = (e: MouseEvent) => {
    if (!isPickingColor.value || !canvasRef.value) return
    
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    // Calculate scale if canvas is displayed at different size than intrinsic
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Get pixel data WITHOUT chroma key applied? 
    // Actually we are rendering WITH chroma key. 
    // To pick effectively, we might need the original image drawn first.
    // For now, let's try picking from what's there. 
    // Problem: if it's already transparent, we might pick standard background?
    
    // Better approach: Draw original frame to an offscreen canvas or just peek the dataUrl?
    // Let's just blindly pick for now and see if user flow holds. 
    // Ideally we disable the filter while picking, or just pick from the Source data.
    
    const p = ctx.getImageData(x, y, 1, 1).data
    const r = p[0] ?? 0
    const g = p[1] ?? 0
    const b = p[2] ?? 0
    const hex = "#" + ("000000" + ((r << 16) | (g << 8) | b).toString(16)).slice(-6)
    chromaStore.targetColor = hex
    isPickingColor.value = false
}

</script>

<template>
    <div class="background-chroma-key-remover">
        <div class="background-chroma-key-remover__title">Remove Background</div>
        <div class="background-chroma-key-remover__description">
            Select a color to remove it from the background. Adjust tolerance to refine the edges.
        </div>
        
        <div class="background-chroma-key-remover__content">
            <div 
                class="background-chroma-key-remover__content__preview" 
                :class="{ 'is-picking': isPickingColor }"
            >
                <canvas 
                    ref="canvasRef" 
                    @click="handleCanvasClick"
                ></canvas>
                <p v-if="framesStore.selectedFrames.length === 0">No frames to process</p>
            </div>

            <div class="background-chroma-key-remover__content__tools">
                <div class="background-chroma-key-remover__content__tools__color-picker">
                    <div 
                        class="background-chroma-key-remover__content__tools__color-picker--color"
                        :style="{ backgroundColor: chromaStore.targetColor }"
                    ></div>
                    <div class="background-chroma-key-remover__content__tools__color-picker--color-label">
                        {{ chromaStore.targetColor }}
                    </div>
                </div>

                <button 
                    class="background-chroma-key-remover__content__tools__choose-color-from-video"
                    :class="{ 'is-active': isPickingColor }"
                    @click="toggleColorPicker"
                    title="Pick color from video"
                >
                    <Pipette class="w-5 h-5" />
                </button>

                <div class="background-chroma-key-remover__tolerance-slider">
                    <div class="background-chroma-key-remover__tolerance-slider__label">
                        Tolerance: {{ chromaStore.tolerance }}
                    </div>
                    <input 
                        type="range" 
                        class="background-chroma-key-remover__tolerance-slider__input"
                        min="0"
                        max="100"
                        v-model.number="chromaStore.tolerance"
                    />
                </div>
            </div>
        
        </div>
        
        <div class="background-chroma-key-remover__continue-btn">
             <AppButton 
                title="Continue"
                variant="primary" 
                @click="$emit('continue')" 
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.background-chroma-key-remover {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 1.5rem;
    position: relative; 
    /* Make sure parent is relative for absolute positioning if needed, 
       but we are using flex so button can just be at bottom */

    &__continue-btn {
        margin-top: auto; /* Push to bottom */
    }

    &__title {
        font-family: 'azlando_sans_semiExpanded', sans-serif;
        font-size: 2rem;
        font-weight: bold;
    }

    &__description {
        color: hsl(var(--muted-foreground));
        font-size: 1.1rem;
        max-width: 600px;
        text-align: center;
    }

    &__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        width: 100%;
        max-width: 800px;

        &__preview {
            width: 100%;
            height: 400px;
            border: 2px solid hsl(var(--border));
            border-radius: 12px;
            background-color: hsl(var(--card));
            /* Checkboard pattern for transparency */
            background-image: 
                linear-gradient(45deg, #ccc 25%, transparent 25%), 
                linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #ccc 75%), 
                linear-gradient(-45deg, transparent 75%, #ccc 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;

            &.is-picking {
                cursor: crosshair;
                border-color: hsl(var(--primary));
            }

            canvas {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
        }

        &__tools {
            display: flex;
            align-items: center;
            gap: 2rem;
            padding: 1rem 2rem;
            background-color: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 12px;
            width: 100%;

            &__color-picker {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                &--color {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid hsl(var(--border));
                    box-shadow: 0 0 0 1px hsl(var(--background));
                }
                
                &--color-label {
                    font-family: monospace;
                    font-size: 0.9rem;
                }
            }

            &__choose-color-from-video {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                border: 1px solid hsl(var(--border));
                background: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    background-color: hsl(var(--muted));
                }

                &.is-active {
                    background-color: hsl(var(--primary));
                    color: hsl(var(--primary-foreground));
                    border-color: transparent;
                }
            }
        }
    }

    &__tolerance-slider {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        &__label {
            font-size: 0.9rem;
            font-weight: 500;
        }

        &__input {
            width: 100%;
            cursor: pointer;
        }
    }
}
</style>