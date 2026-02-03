<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

const props = defineProps<{
  src: string
  frameWidth: number
  frameHeight: number
  totalFrames: number
  cols: number
  rows: number
  fps?: number
  playing?: boolean
}>()

const currentFrame = ref(0)
const animationId = ref<number | null>(null)
const lastFrameTime = ref(0)
const isLoaded = ref(false)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

const frameRate = computed(() => props.fps || 12)
const interval = computed(() => 1000 / frameRate.value)

// Preload image
const image = new Image()

const drawFrame = () => {
    if (!ctx.value || !isLoaded.value || !canvasEl.value) return

    const col = currentFrame.value % props.cols
    const row = Math.floor(currentFrame.value / props.cols)

    const sx = col * props.frameWidth
    const sy = row * props.frameHeight
    
    // Clear canvas
    ctx.value.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height)
    
    // Draw specific frame
    ctx.value.drawImage(
        image, 
        sx, sy, props.frameWidth, props.frameHeight, // Source Rect
        0, 0, canvasEl.value.width, canvasEl.value.height // Destination Rect
    )
}

const updateFrame = (timestamp: number) => {
  if (!lastFrameTime.value) lastFrameTime.value = timestamp
  const elapsed = timestamp - lastFrameTime.value

  if (elapsed >= interval.value) {
    currentFrame.value = (currentFrame.value + 1) % props.totalFrames
    lastFrameTime.value = timestamp - (elapsed % interval.value)
    drawFrame()
  }

  if (props.playing !== false) {
    animationId.value = requestAnimationFrame(updateFrame)
  }
}

const startAnimation = () => {
    if (animationId.value) return
    lastFrameTime.value = performance.now()
    animationId.value = requestAnimationFrame(updateFrame)
}

const stopAnimation = () => {
    if (animationId.value) {
        cancelAnimationFrame(animationId.value)
        animationId.value = null
    }
}

watch(() => props.playing, (newVal) => {
    if (newVal !== false) startAnimation()
    else stopAnimation()
})

onMounted(() => {
    image.src = props.src
    image.onload = () => {
        isLoaded.value = true
        if (canvasEl.value) {
            canvasEl.value.width = props.frameWidth
            canvasEl.value.height = props.frameHeight
            ctx.value = canvasEl.value.getContext('2d')
            // Optional: for pixel art, set false.
            // But for large 1024px images, smoothing true is usually better.
            // ctx.value!.imageSmoothingEnabled = false 
            
            drawFrame() 
            startAnimation()
        }
    }
})

onUnmounted(() => {
    stopAnimation()
})
</script>

<template>
  <div class="sprite-player-container" :style="{ aspectRatio: `${frameWidth} / ${frameHeight}` }">
      <canvas ref="canvasEl" class="sprite-canvas"></canvas>
      <div v-if="!isLoaded" class="loading">Loading...</div>
  </div>
</template>

<style scoped>
.sprite-player-container {
    width: 100%;
    position: relative;
}

.sprite-canvas {
    width: 100%;
    height: 100%;
    display: block;
    /* Ensure the canvas scales nicely in the container */
}

.loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f0f0f0;
    color: #888;
}
</style>
