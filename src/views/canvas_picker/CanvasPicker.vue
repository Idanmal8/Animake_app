<script setup lang="ts">
import { useCanvasPickerStore } from '@/stores/canvas_picker/canvas_picker'
import { useChromaKeyStore } from '@/stores/chroma_key/chroma_key'
import { useVideoFramesStore } from '@/stores/video_frames/video_frames'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import AppButton from '@/components/buttons/AppButton.vue'
import GIF from 'gif.js'
import { useRouter } from 'vue-router'

const canvasStore = useCanvasPickerStore()
const chromaStore = useChromaKeyStore()
const framesStore = useVideoFramesStore()
const router = useRouter()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const previewInterval = ref<number | null>(null)
const currentFrameIndex = ref(0) 

// Cache for pre-loaded images to prevent stuttering
const imageCache = ref<HTMLImageElement[]>([])
const areImagesLoaded = ref(false)

const isGenerating = ref(false)

const preloadImages = async () => {
    areImagesLoaded.value = false
    imageCache.value = []
    
    const promises = framesStore.selectedFrames.map(frame => {
        return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.src = frame.dataUrl
        })
    })

    imageCache.value = await Promise.all(promises)
    areImagesLoaded.value = true
}

const renderPreview = () => {
    if (!canvasRef.value || !areImagesLoaded.value) return
    
    // Safety check for index
    if (currentFrameIndex.value >= imageCache.value.length) {
        currentFrameIndex.value = 0
    }
    const img = imageCache.value[currentFrameIndex.value]
    if (!img) return

    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Target size
    const size = canvasStore.selectedSize
    canvas.width = size
    canvas.height = size
    
    // Pixel art look: Nearest Neighbor scaling
    // We scale the massive video down to 'size x size'.
    ctx.imageSmoothingEnabled = false

    // 1. Draw image resized (Downscale first for performance!)
    // This allows real-time playback. Processing full 1080p frame pixel-by-pixel in JS is too slow.
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size)
    
    // 2. Apply Chroma Key on the small canvas
    // Processing 64x64 pixels is instant.
    chromaStore.processFrameData(ctx, size, size)
}

const startPreview = () => {
    stopPreview()
    if (framesStore.selectedFrames.length === 0) return

    previewInterval.value = window.setInterval(() => {
        let next = currentFrameIndex.value + 1
        if (next >= imageCache.value.length) next = 0
        currentFrameIndex.value = next
    }, 1000 / framesStore.fps)
}

const stopPreview = () => {
    if (previewInterval.value) {
        clearInterval(previewInterval.value)
        previewInterval.value = null
    }
}

const downloadGIF = async () => {
    if (isGenerating.value || !areImagesLoaded.value) return
    isGenerating.value = true
    stopPreview() // Pause preview to save resources
    
    try {
        const size = canvasStore.selectedSize
        const gif = new GIF({
            workers: 2,
            quality: 1, // Best quality
            width: size,
            height: size,
            workerScript: '/gif.worker.js',
            transparent: '0x000000' // Try to detect transparency? strict format?
            // Actually gif.js handles transparency if we pass transparent ImageData/Canvas
        })
        
        // Render each frame to a new temporary canvas and add to GIF
        for (const img of imageCache.value) {
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = size
            tempCanvas.height = size
            const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
            if (!ctx) continue
            
            ctx.imageSmoothingEnabled = false
            ctx.clearRect(0, 0, size, size)
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size)
            chromaStore.processFrameData(ctx, size, size)
            
            gif.addFrame(tempCanvas, { 
                delay: 1000 / framesStore.fps,
                copy: true 
            })
        }
        
        gif.on('finished', (blob: Blob) => {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'animake_pixel_art.gif'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            isGenerating.value = false
            startPreview() // Resume
        })
        
        gif.render()
        
    } catch (e) {
        console.error("GIF Generation failed", e)
        isGenerating.value = false
        startPreview()
    }
}

// Watchers
watch(currentFrameIndex, renderPreview)

// Re-render when settings change
watch(
    [() => canvasStore.selectedSize, () => chromaStore.targetColor, () => chromaStore.tolerance], 
    renderPreview
)

// Re-load images if selected frames change (e.g. back navigation)
watch(() => framesStore.selectedFrames, preloadImages, { deep: true })

onMounted(async () => {
   await preloadImages()
   startPreview() 
})

onUnmounted(() => {
    stopPreview()
})
</script>

<template>
    <div class="canvas-picker">
        <div class="canvas-picker__title">Choose Canvas Size</div>
        <div class="canvas-picker__description">Select the resolution for your pixel art animation.</div>

        <div class="canvas-picker__sizes-pick">
            <button 
                v-for="(size, index) in canvasStore.availableSizes" 
                :key="size"
                class="size-chip"
                :class="{ 'is-selected': canvasStore.selectedSize === size }"
                :style="{ animationDelay: `${index * 0.1}s` }"
                @click="canvasStore.setSize(size)"
            >
                {{ size }}x{{ size }}
            </button>
        </div>
        
        <div class="canvas-picker__preview">
            <!-- 
                Container controls the displayed size.
                We allow it to be wider now. 
            -->
            <div class="preview-box">
                <!-- 
                   The canvas itself is small (e.g. 32x32), 
                   but we scale it up with CSS to fill the box while preserving pixelation.
                -->
                <canvas ref="canvasRef"></canvas>
            </div>
            <p class="preview-label">Preview ({{ canvasStore.selectedSize }}x{{ canvasStore.selectedSize }})</p>
        </div>

        <div class="canvas-picker__continue-btn">
             <!-- Download Button logic -->
             <AppButton 
                :title="isGenerating ? 'Generating GIF...' : 'Download GIF'"
                variant="primary" 
                @click="downloadGIF" 
                :disabled="!areImagesLoaded || isGenerating"
            />
             <AppButton 
                title="Sprite Sheet"
                variant="secondary" 
                @click="router.push({ name: 'sprite-preview' })" 
                :disabled="!areImagesLoaded"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.canvas-picker {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 2rem;

    &__title {
        font-family: 'azlando_sans_semiExpanded', sans-serif;
        font-size: 2rem;
        font-weight: bold;
    }

    &__description {
        color: hsl(var(--muted-foreground));
        font-size: 1.1rem;
    }

    &__sizes-pick {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
        max-width: 800px; /* Wider */
    }

    &__preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 100%;
        max-width: 800px; /* Wider container */
    }
    
    &__continue-btn {
        margin-top: auto;
    }
}

.size-chip {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    
    /* Animation for staggering */
    opacity: 0;
    animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

    &:hover {
        background: hsl(var(--muted));
        transform: translateY(-2px);
    }
    
    &.is-selected {
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        border-color: transparent;
        transform: scale(1.05);
        box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
    }
    
    &:active {
        transform: scale(0.95);
    }
}

.preview-box {
    width: 100%;       /* Fill container */
    max-width: 600px;  /* Max limits */
    aspect-ratio: 16/9; /* Start with wide, but canvas object-fit: contain handles logic */
    height: auto;
    min-height: 400px;
    
    border: 2px solid hsl(var(--border));
    border-radius: 12px;
    background-color: hsl(var(--card));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    
    /* Pixelated rendering for the canvas inside */
    canvas {
         width: 100%;
         height: 100%;
         object-fit: contain; /* Keep aspect ratio of the 24x24 square inside */
         image-rendering: pixelated; 
    }
}

.preview-label {
    font-family: monospace;
    color: hsl(var(--muted-foreground));
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.5);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>