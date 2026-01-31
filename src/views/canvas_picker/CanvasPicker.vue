<script setup lang="ts">
import { useCanvasPickerStore } from '@/stores/canvas_picker/canvas_picker'
import { useChromaKeyStore } from '@/stores/chroma_key/chroma_key'
import { useVideoFramesStore } from '@/stores/video_frames/video_frames'
import { useSpritesStore } from '@/stores/sprites/sprites'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import AppButton from '@/components/buttons/AppButton.vue'
import GIF from 'gif.js'
import { useRouter } from 'vue-router'
import flutterIcon from '@/assets/icons/flutter.svg'

const canvasStore = useCanvasPickerStore()
const chromaStore = useChromaKeyStore()
const framesStore = useVideoFramesStore()
const spritesStore = useSpritesStore()
const router = useRouter()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const previewInterval = ref<number | null>(null)
const currentFrameIndex = ref(0) 

// Cache for pre-loaded images to prevent stuttering
const imageCache = ref<HTMLImageElement[]>([])
const areImagesLoaded = ref(false)

const isGenerating = ref(false)
const isSuccess = ref(false)
const generatedFilename = ref('')
const showFlutterModal = ref(false)
const generatedMetadata = ref<{ cols: number; rows: number } | null>(null)

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

const handleDownloadSpriteSheet = async () => {
    if (isGenerating.value || !areImagesLoaded.value) return
    isGenerating.value = true
    stopPreview()

    try {
        const size = canvasStore.selectedSize
        const allFramesData: ImageData[] = []
        
        // Use imageCache which is already loaded
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
            
            const imageData = ctx.getImageData(0, 0, size, size)
            allFramesData.push(imageData)
        }

        const { imageUrl, metadata } = await spritesStore.generateSpriteSheet(allFramesData, framesStore.fps)
        
        // Download Image
        const filename = `sprite_sheet_${metadata.cols}x${metadata.rows}.png`
        const a = document.createElement('a')
        a.href = imageUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        generatedFilename.value = filename
        generatedMetadata.value = metadata
        isSuccess.value = true
        
    } catch (e) {
        console.error("Sprite sheet generation failed", e)
        alert("Failed to generate Sprite Sheet: " + e)
    } finally {
        isGenerating.value = false
        stopPreview() // Stop preview on success/completion
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

watch(isSuccess, (success) => {
    if (!success) {
        // Returned to preview mode, restart animation
        setTimeout(() => {
            renderPreview()
            startPreview()
        }, 100)
    }
})

onMounted(async () => {
   await preloadImages()
   startPreview() 
})

onUnmounted(() => {
    stopPreview()
})

const flutterCode = computed(() => {
    if (!generatedMetadata.value) return ''
    // remove extension for the asset loader usually, but user template has .png
    // The user template: images.load('{{sprite_file}}.png');
    // generatedFilename includes extension?
    // Let's assume generatedFilename is "sprite_sheet_4x4.png"
    // Use basename logic or just name without extension if the template adds .png?
    // Template: images.load('{{sprite_file}}.png');
    // So {{sprite_file}} should be the name WITHOUT .png
    const nameWithoutExt = generatedFilename.value.replace(/\.png$/i, '')
    
    return `import 'dart:ui';
import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:flame/game.dart';

class MyGame extends FlameGame {
  @override
  Color backgroundColor() => const Color.fromARGB(0, 255, 255, 255);

  @override
  Future<void> onLoad() async {
    debugMode = false; // Enables FPS counter and hitboxes

    // 1. Load the sprite sheet image
    final spriteSheet = await images.load('${nameWithoutExt}.png');

    // 2. Create the animation data
    final int amountPerRow = ${generatedMetadata.value.cols};
    final int amount = ${framesStore.selectedFrames.length};

    final frameWidth = spriteSheet.width / amountPerRow;
    final frameHeight = spriteSheet.height / amountPerRow;

    final animation = SpriteAnimation.fromFrameData(
      spriteSheet,
      SpriteAnimationData.sequenced(
        amount: amount,
        stepTime: ${ (1 / framesStore.fps).toFixed(3) }, // 1 / fps
        textureSize: Vector2(frameWidth, frameHeight),
        amountPerRow: amountPerRow,
        loop: true,
      ),
    );

    // 3. Create the component
    final player = SpriteAnimationComponent(
      animation: animation,
      size: Vector2(128, 128), // size of the sprite on the screen
      position: Vector2(0, 0), //position on screen
    );

    add(player);
  }
}
`
})

const flutterWidgetCode = computed(() => {
    return `return Center(
  child: SizedBox(
    width: 128, // Size of the sprite
    height: 128, // Size of the sprite
    child: GameWidget(game: MyGame()),
  ),
);`
})

const copiedSection = ref<string | null>(null)

const copyToClipboard = async (text: string, section: string) => {
    try {
        await navigator.clipboard.writeText(text)
        copiedSection.value = section
        setTimeout(() => {
            copiedSection.value = null
        }, 2000)
    } catch (err) {
        console.error('Failed to copy: ', err)
    }
}
</script>

<template>
    <div class="canvas-picker">
        <template v-if="!isSuccess">
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
                <div class="flex gap-4">
                    <AppButton 
                        title="Back"
                        variant="ghost" 
                        @click="$emit('back')" 
                    />
                    <AppButton 
                        :title="isGenerating ? 'Generating...' : 'Download Sprite Sheet'"
                        variant="secondary" 
                        @click="handleDownloadSpriteSheet" 
                        :disabled="!areImagesLoaded || isGenerating"
                    />
                </div>
            </div>
        </template>

        <div v-else class="success-view">
            <div class="success-icon">
                🎉
            </div>
            <h2 class="success-title">Success!</h2>
            <div class="file-info">
                <span class="label">Generated:</span>
                <span class="filename">{{ generatedFilename }}</span>
            </div>

            <div class="actions">
                <AppButton
                    title="Implement in Flutter"
                    variant="primary"
                    :icon="flutterIcon"
                    @click="showFlutterModal = true"
                />
                 <AppButton 
                    title="Back"
                    variant="ghost" 
                    @click="isSuccess = false" 
                />
                 <AppButton 
                    title="Start Over"
                    variant="ghost" 
                    @click="router.go(0)" 
                />
            </div>
        </div>

        <!-- Flutter Code Modal -->
        <Transition name="fade">
            <div v-if="showFlutterModal" class="modal-overlay" @click.self="showFlutterModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Implement in Flame Engine</h3>
                        <button class="close-btn" @click="showFlutterModal = false">×</button>
                    </div>
                    <div class="modal-body">
                        <!-- Left Column: Game Class -->
                        <div class="code-column">
                            <div class="column-header">
                                <span>Game Class (my_game.dart)</span>
                                <button class="copy-icon-btn" @click="copyToClipboard(flutterCode, 'game')" title="Copy Code">
                                    <svg v-if="copiedSection === 'game'" class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                            </div>
                            <div class="code-block">
                                <pre><code>{{ flutterCode }}</code></pre>
                            </div>
                        </div>

                        <!-- Right Column: Widget Implementation -->
                        <div class="code-column">
                             <div class="column-header">
                                <span>Widget Implementation</span>
                                <button class="copy-icon-btn" @click="copyToClipboard(flutterWidgetCode, 'widget')" title="Copy Code">
                                    <svg v-if="copiedSection === 'widget'" class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                            </div>
                            <div class="code-block">
                                <pre><code>{{ flutterWidgetCode }}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
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
    aspect-ratio: 1; /* Square canvas */
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

.success-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1.5rem;
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.success-icon {
    font-size: 4rem;
}

.success-title {
     font-family: 'azlando_sans_semiExpanded', sans-serif;
     font-size: 2.5rem;
     font-weight: bold;
     color: hsl(var(--foreground));
}

.file-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    background: hsl(var(--muted));
    padding: 1rem 2rem;
    border-radius: 8px;
    border: 1px solid hsl(var(--border));
}

.label {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
}

.filename {
    font-family: monospace;
    font-size: 1.1rem;
    font-weight: 600;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.modal-content {
    background: #1e1e1e; /* Dark IDE background */
    border: 1px solid #333;
    border-radius: 12px;
    width: 95%; /* Wider */
    max-width: 1200px; /* Big modal */
    height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    color: #d4d4d4;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #333;
    background: #252526;
    color: #cccccc;

    h3 {
        font-family: 'azlando_sans_semiExpanded', sans-serif;
        font-weight: bold;
        font-size: 1.2rem;
    }
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    color: #888;
    
    &:hover {
        color: white;
    }
}

.modal-body {
    display: flex;
    flex: 1;
    overflow: hidden; /* Scroll inside columns */
    flex-direction: row;
}

.code-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #333;
    min-width: 0; /* Prevent flex overflow */
    
    &:last-child {
        border-right: none;
    }
}

.column-header {
    padding: 0.5rem 1rem;
    background: #252526;
    border-bottom: 1px solid #333;
    font-size: 0.85rem;
    font-weight: 600;
    color: #9cdcfe; /* VS Code blueish */
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.code-block {
    position: relative;
    padding: 1rem;
    background: #1e1e1e; 
    color: #d4d4d4;
    overflow: auto;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.9rem;
    flex: 1;
    line-height: 1.5;
    
    pre {
        margin: 0;
        white-space: pre-wrap;
    }
}

.copy-icon-btn {
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    
    &:hover {
        background: rgba(255,255,255,0.1);
        color: white;
    }
    
    &:active {
        transform: scale(0.95);
    }
}

.check-icon {
    color: #4ec9b0; /* VS Code green */
    font-weight: bold;
    font-size: 1.1rem;
    animation: popIn 0.3s ease-out;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-content,
.fade-leave-active .modal-content {
  transition: transform 0.3s ease-in-out;
}

.fade-enter-from .modal-content,
.fade-leave-to .modal-content {
  transform: scale(0.9);
}
</style>