<script setup lang="ts">
import { useCanvasPickerStore } from '@/stores/canvas_picker/canvas_picker'
import { useChromaKeyStore } from '@/stores/chroma_key/chroma_key'
import { useVideoFramesStore } from '@/stores/video_frames/video_frames'
import { useSpritesStore } from '@/stores/sprites/sprites'
import { useLoginStore } from '@/stores/login/login'
import { useToastStore } from '@/stores/toast/toast'
import { analyticsService } from '@/api/services/analytics'
import { ToastType } from '@/components/toasts/enums'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import AppButton from '@/components/buttons/AppButton.vue'
import GIF from 'gif.js'
import { useRouter } from 'vue-router'
import flutterIcon from '@/assets/icons/flutter.svg'
import { Loader2 } from 'lucide-vue-next'

const canvasStore = useCanvasPickerStore()
const chromaStore = useChromaKeyStore()
const framesStore = useVideoFramesStore()
const spritesStore = useSpritesStore()
const loginStore = useLoginStore()
const router = useRouter()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'show-paywall', payload: { title: string, description: string }): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const previewInterval = ref<number | null>(null)

// ... (existing code, skipping lines for brevity in replacement if not matching unique block, 
// strictly speaking I should use multiple chunks or ensure uniqueness. 
// The emits block is unique enough. 
// The handleDownload function start is unique enough.
// I can't do both in one REPLACE call if they are far apart unless I replace the whole middle chunk which is bad.
// I will split this into two calls or use multi_replace.
// Let's use multi_replace.

// Wait, I am using `replace_file_content` tool. It supports single block.
// I will use `replace_file_content` for Emits first.

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
    const width = canvasStore.width
    const height = canvasStore.height
    canvas.width = width
    canvas.height = height
    
    // Pixel art look: Nearest Neighbor scaling
    // We scale the massive video down to target resolution.
    ctx.imageSmoothingEnabled = false

    // 1. Draw image resized (Downscale first for performance!)
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height)
    
    // 2. Apply Chroma Key on the small canvas
    chromaStore.processFrameData(ctx, width, height)
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
        const width = canvasStore.width
        const height = canvasStore.height
        const gif = new GIF({
            workers: 2,
            quality: 1, // Best quality
            width: width,
            height: height,
            workerScript: '/gif.worker.js',
            transparent: '0x000000' 
        })
        
        // Render each frame to a new temporary canvas and add to GIF
        for (const img of imageCache.value) {
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = width
            tempCanvas.height = height
            const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
            if (!ctx) continue
            
            ctx.imageSmoothingEnabled = false
            ctx.clearRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height)
            chromaStore.processFrameData(ctx, width, height)
            
            gif.addFrame(tempCanvas, { 
                delay: 1000 / framesStore.fps,
                copy: true 
            })
        }
        
        gif.on('finished', (blob: Blob) => {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `animake_${width}x${height}.gif`
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

    // Check trial usage
    if (!loginStore.isSubscribed && loginStore.trialUsage && loginStore.trialUsage.remaining <= 0) {
        emit('show-paywall', {
            title: 'Free Trial Ended',
            description: 'You have used all your free generations. Upgrade to Pro to continue creating.'
        })
        return
    }

    isGenerating.value = true
    stopPreview()

    try {
        const width = canvasStore.width
        const height = canvasStore.height
        
        // Use Backend for heavy lifting (resizing, chroma key, stitching)
        const { imageUrl, metadata } = await spritesStore.generateSpriteSheetBackend(
            framesStore.selectedFrames,
            width,
            height,
            framesStore.fps,
            chromaStore.targetColor,
            chromaStore.tolerance
        )
        
        // Download Image
        const filename = `sprite_sheet_${metadata.cols}x${metadata.rows}_${width}x${height}.png`
        const a = document.createElement('a')
        a.href = imageUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        generatedFilename.value = filename
        generatedMetadata.value = metadata
        isSuccess.value = true
        
        // Increment trial usage
        await loginStore.incrementTrialUsage()

        // Track Event
        analyticsService.track('sprite_sheet_generated', {
            width,
            height,
            fps: framesStore.fps,
            total_frames: framesStore.selectedFrames.length,
            is_trial: !loginStore.isSubscribed
        })
        
    } catch (e: any) {
        console.error("Sprite sheet generation failed", e)
        // If it's a rate limit error, the modal is already shown globaly. 
        // We can check the message or just show a generic error toast for other cases.
        // For now, let's show an error toast, but maybe avoid it if we know it's 429?
        // But since we can't easily parse the error object from here (it's a string in the throw usually or Error object),
        // let's just use toast which is non-blocking.
        const toastStore = useToastStore()
        toastStore.show('Error', 'Failed to generate Sprite Sheet. Please try again.', ToastType.Error)
    } finally {
        isGenerating.value = false
        stopPreview() // Stop preview on success/completion
    }
}

const safeDebounce = (fn: Function, delay: number) => {
    let timeout: number | null = null
    return (...args: any[]) => {
        if (timeout) clearTimeout(timeout)
        timeout = window.setTimeout(() => {
            fn(...args)
        }, delay)
    }
}

const debouncedRender = safeDebounce(() => {
    // Only render if dimensions are valid (prevent 0x0 or huge crashes)
    if (canvasStore.width > 0 && canvasStore.height > 0 && canvasStore.width <= 4096 && canvasStore.height <= 4096) {
        renderPreview()
    }
}, 300)

// Watchers
watch(currentFrameIndex, renderPreview)

// Re-render when settings change (debounced for inputs)
watch(
    [() => canvasStore.width, () => canvasStore.height, () => chromaStore.targetColor, () => chromaStore.tolerance], 
    debouncedRender
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

const handleCustomDimension = (dim: 'w' | 'h', event: Event) => {
    const target = event.target as HTMLInputElement
    let val = parseInt(target.value)
    
    if (isNaN(val)) return

    // Cap at 1200 as per requirement
    if (val > 1200) val = 1200
    if (val < 1) val = 1
    
    // Update input visually if clamped
    if (String(val) !== target.value) {
        target.value = String(val)
    }

    if (dim === 'w') {
        canvasStore.setSize(val, canvasStore.height)
    } else {
        canvasStore.setSize(canvasStore.width, val)
    }
}

const flutterCode = computed(() => {
    if (!generatedMetadata.value) return ''
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

    // Calculate frame size from total sheet size
    // sheetWidth / cols, sheetHeight / rows
    // Or just use the known frameWidth/Height from metadata if available (it is).
    // But for safety:
    final frameWidth = spriteSheet.width / amountPerRow;
    // For rows, we need to know rows count or calculate?
    // Metadata has rows.
    final int rows = ${generatedMetadata.value.rows};
    final frameHeight = spriteSheet.height / rows;

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
      size: Vector2(${canvasStore.width}.0, ${canvasStore.height}.0), // Render size
      position: Vector2(100, 100),
    );

    add(player);
  }
}
`
})

const flutterWidgetCode = computed(() => {
    return `return Center(
  child: SizedBox(
    width: ${canvasStore.width}, // Size of the sprite
    height: ${canvasStore.height}, // Size of the sprite
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

const openCloudConvert = () => {
    window.open('https://cloudconvert.com/png-to-webp', '_blank')
}
</script>

<template>
    <div class="canvas-picker">
        <div v-if="isGenerating" class="canvas-picker__loading-overlay">
            <Loader2 class="canvas-picker__spinner" :size="48" />
            <p class="canvas-picker__loading-text">Generating Sprite Sheet...</p>
        </div>
        <template v-if="!isSuccess">
            <div class="canvas-picker__title">Choose Canvas Size</div>
            <div class="canvas-picker__description">Select a preset or enter custom dimensions.</div>

            <div class="canvas-picker__options">
                <div class="custom-dimensions">
                    <div class="input-group">
                        <label>Width</label>
                        <input 
                            type="number" 
                            :value="canvasStore.width"
                            @input="e => handleCustomDimension('w', e)"
                            min="1" 
                            max="1200"
                        >
                    </div>
                    <div class="x-divider">✕</div>
                    <div class="input-group">
                        <label>Height</label>
                        <input 
                            type="number" 
                            :value="canvasStore.height"
                            @input="e => handleCustomDimension('h', e)"
                            min="1" 
                            max="1200"
                        >
                    </div>
                </div>
                <div class="preset-category">
                    <div class="category-label">Square</div>
                    <div class="canvas-picker__sizes-pick">
                        <button 
                            v-for="size in [24, 32, 48, 64, 128, 256, 512, 1024]" 
                            :key="size"
                            class="size-chip"
                            :class="{ 'is-selected': canvasStore.width === size && canvasStore.height === size }"
                            @click="canvasStore.setSize(size, size)"
                        >
                            {{ size }}px
                        </button>
                    </div>
                </div>

                <div class="preset-category">
                    <div class="category-label">Landscape (Wide)</div>
                    <div class="canvas-picker__sizes-pick">
                        <button 
                            v-for="size in [{w:48,h:24}, {w:64,h:32}, {w:128,h:64}, {w:256,h:128}, {w:512,h:256}, {w:1024,h:512}]" 
                            :key="size.w"
                            class="size-chip"
                            :class="{ 'is-selected': canvasStore.width === size.w && canvasStore.height === size.h }"
                            @click="canvasStore.setSize(size.w, size.h)"
                        >
                            {{ size.w }}x{{ size.h }}
                        </button>
                    </div>
                </div>

                <div class="preset-category">
                    <div class="category-label">Portrait (Tall)</div>
                    <div class="canvas-picker__sizes-pick">
                        <button 
                            v-for="size in [{w:24,h:48}, {w:32,h:64}, {w:64,h:128}, {w:128,h:256}, {w:256,h:512}, {w:512,h:1024}]" 
                            :key="size.w"
                            class="size-chip"
                            :class="{ 'is-selected': canvasStore.width === size.w && canvasStore.height === size.h }"
                            @click="canvasStore.setSize(size.w, size.h)"
                        >
                            {{ size.w }}x{{ size.h }}
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="canvas-picker__preview">
                <div class="preview-box">
                    <canvas ref="canvasRef"></canvas>
                </div>
                <p class="preview-label">Preview ({{ canvasStore.width }}x{{ canvasStore.height }})</p>
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
                
                <div class="optimization-section">
                    <p class="optimization-text">To make size optimal, convert to WebP and then use in your Flutter app.</p>
                    <AppButton 
                        title="Convert to WebP (CloudConvert)"
                        variant="secondary"
                        @click="openCloudConvert"
                    />
                </div>

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

    &__options {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
        max-width: 800px;
    }

    &__sizes-pick {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
        width: 100%;
    }

    .custom-dimensions {
        display: flex;
        align-items: flex-end;
        gap: 1rem;
        padding: 1rem;
        background: hsl(var(--card));
        border: 1px solid hsl(var(--border));
        border-radius: 12px;
        
        .input-group {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            
            label {
                font-size: 0.75rem;
                font-weight: 600;
                color: hsl(var(--muted-foreground));
                text-transform: uppercase;
            }
            
            input {
                background: hsl(var(--background));
                border: 1px solid hsl(var(--border));
                color: hsl(var(--foreground));
                padding: 0.5rem;
                border-radius: 6px;
                width: 80px;
                text-align: center;
                font-family: monospace;
                font-size: 1rem;
                
                &:focus {
                    outline: 2px solid hsl(var(--primary));
                    border-color: transparent;
                }
            }
        }
        
        .x-divider {
            padding-bottom: 0.5rem;
            color: hsl(var(--muted-foreground));
            font-weight: bold;
        }
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

    &__loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background-color: hsl(var(--background) / 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    &__spinner {
        color: hsl(var(--primary));
        animation: spin 1s linear infinite;
    }

    &__loading-text {
        font-family: 'azlando_sans_semiExpanded', sans-serif;
        font-size: 1.2rem;
        color: hsl(var(--foreground));
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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

.preset-category {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.category-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: hsl(var(--muted-foreground));
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
}

.size-chip {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.9rem;
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
    align-items: center; /* Center buttons */
    gap: 1rem;
    margin-top: 2rem;
    width: 100%;
    max-width: 400px;
}

.optimization-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: hsl(var(--card));
    border: 1px dashed hsl(var(--border));
    border-radius: 8px;
    width: 100%;
}

.optimization-text {
    font-size: 0.8rem;
    color: hsl(var(--muted-foreground));
    text-align: center;
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