<script setup lang="ts">
import { useCanvasPickerStore } from '@/stores/canvas_picker/canvas_picker'
import { useChromaKeyStore } from '@/stores/chroma_key/chroma_key'
import { useVideoFramesStore } from '@/stores/video_frames/video_frames'
import { useVectorizationStore, type VectorRect } from '@/stores/vectorization/vectorization'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import AppButton from '@/components/buttons/AppButton.vue'
import { DotLottie } from '@dotlottie/dotlottie-js'

const canvasStore = useCanvasPickerStore()
const chromaStore = useChromaKeyStore()
const framesStore = useVideoFramesStore()
const vectorStore = useVectorizationStore()

const currentFrameIndex = ref(0)
const previewInterval = ref<number | null>(null)
const isGenerating = ref(false)
const currentSvgPreview = ref<string>("")

// We need to process the images to get ImageData for the tracer
// This logic is similar to CanvasPicker but we extract data instead of just drawing
const processCurrentFrame = async () => {
    const selected = framesStore.selectedFrames
    if (selected.length === 0) return

    if (currentFrameIndex.value >= selected.length) currentFrameIndex.value = 0
    const frame = selected[currentFrameIndex.value]
    if (!frame) return
    if (!frame.dataUrl || frame.dataUrl.length < 100) {
        console.warn("[Client] Invalid frame dataUrl", frame);
        return;
    }

    const img = new Image()
    img.onload = async () => {
        const size = canvasStore.selectedSize
        
        // 1. Draw source
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = size
        tempCanvas.height = size
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size)

        // 2. Apply Chroma Key
        chromaStore.processFrameData(ctx, size, size)

        // 3. Trace Vector
        // We do NOT call backend here to avoid spamming.
        // Vectorization happens only on Download.
        
        // Raster Preview: Show what we are about to send
        currentSvgPreview.value = tempCanvas.toDataURL("image/png")
    }
    img.src = frame.dataUrl
}

const downloadLottie = async () => {
    if (isGenerating.value) return
    isGenerating.value = true
    stopPreview()

    try {
        const selected = framesStore.selectedFrames
        const size = canvasStore.selectedSize
        const allFramesShapes: any[][] = []

        // Process all frames locally
        // We can reuse the same canvas
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = size
        tempCanvas.height = size
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error("Canvas context failed")
        ctx.imageSmoothingEnabled = false

        // Load images sequentially with UI yielding
        // Load images sequentially with UI yielding and Progress Tracking
        for (let i = 0; i < selected.length; i++) {
            const frame = selected[i]
            
            // Update UI
            currentFrameIndex.value = i
            
            if (!frame) continue;

            await new Promise<void>((resolve, reject) => {
                const img = new Image()
                img.onload = async () => {
                    try {
                        ctx.clearRect(0, 0, size, size)
                        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size)
                        chromaStore.processFrameData(ctx, size, size)
                        
                        const imageData = ctx.getImageData(0, 0, size, size)
                        
                        // Update Visual Preview (Raster)
                        currentSvgPreview.value = tempCanvas.toDataURL("image/png")
                        
                        // MANDATORY: Give the browser a moment to render UI
                        await new Promise(r => setTimeout(r, 10))

                        // Trace
                        const shapes = await vectorStore.traceFrame(imageData)
                        allFramesShapes.push(shapes)
                        
                        resolve()
                    } catch (e) {
                         reject(e)
                    }
                }
                img.onerror = reject
                img.src = frame.dataUrl
            })
        }

        const lottieData = vectorStore.generateLottieJSON(allFramesShapes, framesStore.fps, size, size)
        
        let blob: Blob
        let filename: string

        // Force JSON Download
        blob = new Blob([JSON.stringify(lottieData)], { type: 'application/json' })
        filename = 'animake_export.json'
        
        // Download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

    } catch (e) {
        console.error("Lottie generation failed", e)
        alert("Failed to generate Lottie: " + e)
    } finally {
        isGenerating.value = false
        startPreview()
    }
}


const startPreview = () => {
    stopPreview()
    if (framesStore.selectedFrames.length === 0) return

    previewInterval.value = window.setInterval(() => {
        let next = currentFrameIndex.value + 1
        if (next >= framesStore.selectedFrames.length) next = 0
        currentFrameIndex.value = next
        processCurrentFrame()
    }, 1000 / framesStore.fps)
}

const stopPreview = () => {
    if (previewInterval.value) {
        clearInterval(previewInterval.value)
        previewInterval.value = null
    }
}

onMounted(() => {
    processCurrentFrame()
    startPreview()
})

onUnmounted(() => stopPreview())

// SVG ViewBox
const viewBox = computed(() => `0 0 ${canvasStore.selectedSize} ${canvasStore.selectedSize}`)
</script>

<template>
    <div class="lottie-preview">
        <div class="header">
            <div class="title">Vector Preview</div>
            <div class="description">
                Converted to SVG shapes (Path Tracing Mode).
                This is how the Lottie file will be constructed.
            </div>
        </div>

        <div class="preview-container">
            <!-- SVG Box (Hidden if empty or shown if we had it) -->
            <!-- Raster Preview (Fallback when no SVG) -->
            <div class="svg-box">
               <img v-if="currentSvgPreview" :src="currentSvgPreview" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
            
            <!-- Loading Overlay -->
            <div v-if="isGenerating" class="processing-overlay">
                <div class="spinner"></div>
                <div class="status-text">
                    Vectorizing Frame {{ currentFrameIndex + 1 }} / {{ framesStore.selectedFrames.length }}
                    <br>
                    <span class="sub-text">Processing on Backend...</span>
                </div>
            </div>

            <p class="stats" v-else>Frame: {{ currentFrameIndex + 1 }} / {{ framesStore.selectedFrames.length }}</p>
        </div>

        <div class="actions">
             <AppButton 
                :title="isGenerating ? 'Generating JSON...' : 'Download Lottie JSON'"
                variant="primary" 
                :disabled="isGenerating"
                :loading="isGenerating"
                @click="downloadLottie"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.lottie-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 2rem;
    height: 100%;
}

.header {
    text-align: center;
    
    .title {
        font-family: 'azlando_sans_semiExpanded', sans-serif;
        font-size: 2rem;
        font-weight: bold;
    }
    
    .description {
        color: hsl(var(--muted-foreground));
        font-size: 1.1rem;
        margin-top: 0.5rem;
    }
}

.preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.svg-box {
    width: 500px;
    height: 500px;
    border: 2px solid hsl(var(--border));
    background: hsl(var(--card));
    border-radius: 12px;
    padding: 1rem; /* Visual padding */
    display: flex; /* Centering */
    
    svg {
        width: 100%;
        height: 100%;
        /* vector-effect: non-scaling-stroke; */
    }
}

.stats {
    font-family: monospace;
    color: hsl(var(--muted-foreground));
}

.actions {
    margin-top: auto;
}

.processing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    border-radius: 12px;
    z-index: 10;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.status-text {
    text-align: center;
    font-size: 1.2rem;
}

.sub-text {
    font-size: 0.9rem;
    opacity: 0.8;
    font-weight: normal;
}

/* Ensure container has relative positioning for absolute overlay */
.preview-container {
    position: relative; 
    /* ... existing props ... */
}
</style>
