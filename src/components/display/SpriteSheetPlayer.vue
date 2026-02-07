<script setup lang="ts">
import { computed, onMounted } from 'vue'

const props = defineProps<{
  src: string
  frameWidth: number
  frameHeight: number
  totalFrames: number
  cols: number
  rows: number
  fps?: number
  playing?: boolean
  delay?: number // Optional start delay in seconds
}>()

const fps = props.fps || 24
const duration = props.totalFrames / fps

// Generate a unique ID for this player instance to scope the keyframes
const uid = `sprite-${Math.random().toString(36).substr(2, 9)}`

// Generate precise keyframes for the sprite grid
const keyframes = computed(() => {
    let css = `@keyframes ${uid} {`
    const step = 100 / props.totalFrames
    
    // Calculate percentage increments
    // For background-position percentages: 0% is left, 100% is right.
    const xStep = props.cols > 1 ? 100 / (props.cols - 1) : 0
    const yStep = props.rows > 1 ? 100 / (props.rows - 1) : 0

    for (let i = 0; i < props.totalFrames; i++) {
        const col = i % props.cols
        const row = Math.floor(i / props.cols)
        
        const xPos = col * xStep
        const yPos = row * yStep
        
        css += `
        ${i * step}% { background-position: ${xPos}% ${yPos}%; }`
    }
    // Final frame wrap (optional, but keep it clean)
    css += `}`
    return css
})

const styleElement = computed(() => {
    return `<style>${keyframes.value}</style>`
})
</script>

<template>
  <div class="sprite-player-container">
      <!-- Inject dynamic styles -->
      <div v-html="styleElement"></div>
      
      <div 
        class="sprite-display"
        :style="{
            backgroundImage: `url(${src})`,
            backgroundSize: `${cols * 100}% ${rows * 100}%`,
            animationName: uid,
            animationDuration: `${duration}s`,
            animationTimingFunction: `steps(1)`,
            animationIterationCount: 'infinite',
            animationPlayState: playing ? 'running' : 'paused'
        }"
      ></div>
  </div>
</template>

<style scoped>
.sprite-player-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
}

.sprite-display {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    /* Force GPU acceleration */
    will-change: background-position;
    transform: translateZ(0); 
    backface-visibility: hidden;
}
</style>
