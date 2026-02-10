<script setup lang="ts">
import { useVideoFramesStore } from '@/stores/video_frames/video_frames'
import { onMounted, watch, ref } from 'vue'
import AppButton from '@/components/buttons/AppButton.vue'
import { Play, Pause, ZoomIn, ZoomOut, CheckSquare, Square } from 'lucide-vue-next'

const store = useVideoFramesStore()
const previewInterval = ref<number | null>(null)
const localFps = ref(store.fps)

const emit = defineEmits<{
  (e: 'continue'): void
  (e: 'back'): void
}>()

// Generate frames on mount (triggered by navigation from previous step)
onMounted(() => {
    store.generateFrames()
})

// Preview Logic
const togglePlay = () => {
    store.isPlaying = !store.isPlaying
}

watch(() => store.isPlaying, (playing) => {
    if (playing) {
        startPreview()
    } else {
        stopPreview()
    }
})

const startPreview = () => {
    if (previewInterval.value) clearInterval(previewInterval.value)
    
    previewInterval.value = window.setInterval(() => {
        const selected = store.selectedFrames
        if (selected.length === 0) return

        let nextIndex = store.currentPreviewFrame + 1
        if (nextIndex >= selected.length) nextIndex = 0
        store.currentPreviewFrame = nextIndex
    }, 1000 / store.fps) // Play at captured FPS
}

const stopPreview = () => {
    if (previewInterval.value) {
        clearInterval(previewInterval.value)
        previewInterval.value = null
    }
}

// Ensure interval updates if FPS changes while playing
watch(() => store.fps, () => {
    if (store.isPlaying) {
        startPreview()
    }
})

// Handle selection changes to prevent out-of-bounds index
watch(() => store.selectedFrames.length, (newLength) => {
    if (store.currentPreviewFrame >= newLength) {
        store.currentPreviewFrame = 0
    }
})

// Clean up
watch(() => store.isGenerating, (val) => {
   if(!val) {
       // Auto select all when done? Store default is true.
   }
})

</script>

<template>
    <div class="video-frames-slicing">
        <!-- Overlay Loader -->
        <Transition name="fade">
            <div v-if="store.isGenerating" class="loader-overlay">
                <p>Processing video frames...</p>
                <div class="spinner"></div>
            </div>
        </Transition>

        <div class="video-wrapper" :class="{ 'is-loading': store.isGenerating }">
             <!-- Tools Bar -->
            <div class="video-frames-tools">
                <div class="tool-group">
                    <button class="icon-btn" @click="store.zoomLevel = Math.max(0.5, store.zoomLevel - 0.25)">
                        <ZoomOut class="w-4 h-4" />
                    </button>
                    <span class="zoom-label">{{ Math.round(store.zoomLevel * 100) }}%</span>
                    <button class="icon-btn" @click="store.zoomLevel = Math.min(3, store.zoomLevel + 0.25)">
                        <ZoomIn class="w-4 h-4" />
                    </button>
                </div>

                <div class="tool-group">
                    <button class="text-btn" @click="store.selectAll">Select All</button>
                    <button class="text-btn" @click="store.selectNone">Select None</button>
                </div>
            </div>

            <!-- Frames Grid -->
            <div class="video-frames" :style="{ '--zoom': store.zoomLevel }">
                <div 
                    v-for="frame in store.frames" 
                    :key="frame.id" 
                    class="frame-item"
                    :class="{ 'is-selected': frame.selected }"
                    @click="store.toggleFrame(frame.id)"
                >
                    <img :src="frame.dataUrl" loading="lazy" />
                    <div class="frame-number">#{{ frame.id + 1 }}</div>
                    <div class="selection-indicator">
                        <CheckSquare v-if="frame.selected" class="w-4 h-4 text-primary" />
                        <Square v-else class="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
            </div>

            <!-- Preview Area -->
            <div class="video-preview-section">
                <h3>Preview Animation</h3>
                <div class="preview-container">
                    <div v-if="store.selectedFrames.length > 0" class="preview-frame">
                         <img :src="store.selectedFrames[store.currentPreviewFrame]?.dataUrl" />
                    </div>
                     <div v-else class="empty-preview">
                        No frames selected
                    </div>
                </div>
            </div>

            <!-- Playback Tools & Continue -->
            <div class="video-tools__left">
                 <!-- Spacer -->
            </div>

            <div class="video-tools__center">
                    <button class="play-button" @click="togglePlay">
                    <Pause v-if="store.isPlaying" class="w-6 h-6 fill-current" />
                    <Play v-else class="w-6 h-6 fill-current pl-1" />
                </button>
                
                <div class="fps-control">
                    <span class="fps-label">FPS: {{ localFps }}</span>
                    <input 
                        type="range" 
                        min="24" 
                        max="32" 
                        step="1" 
                        :value="localFps" 
                        @input="(e) => localFps = Number((e.target as HTMLInputElement).value)"
                        @change="store.setFps(localFps)"
                    />
                </div>
            </div>

            <div class="video-tools__right">
                <div class="flex gap-4">
                     <AppButton 
                        title="Back"
                        variant="ghost" 
                        @click="$emit('back')" 
                    />
                    <AppButton 
                        title="Continue"
                        variant="primary" 
                        @click="$emit('continue')" 
                        :disabled="store.selectedFrames.length === 0"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.video-frames-slicing {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative; /* For loader positioning */
}

/* Loader Overlay */
.loader-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: hsl(var(--background) / 0.8);
    backdrop-filter: blur(4px);
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    font-size: 1.2rem;
    font-weight: 500;
}

.spinner {
    width: 48px;
    height: 48px;
    border: 4px solid hsl(var(--muted));
    border-top-color: hsl(var(--primary));
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.video-wrapper {
    width: 100%;
    max-width: 1000px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    transition: opacity 0.3s ease;

    &.is-loading {
        pointer-events: none; /* Prevent clicks while loading */
        opacity: 0.5; /* Fade out background content */
    }
}

.video-frames-tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 8px;
}

.tool-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.icon-btn, .text-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: hsl(var(--foreground));
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    font-size: 0.875rem;

    &:hover {
        background-color: hsl(var(--muted));
    }
}

.video-frames {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(calc(100px * var(--zoom)), 1fr));
    gap: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
    padding: 0.5rem;
    background-color: hsl(var(--muted) / 0.3);
    border-radius: 8px;
    border: 1px solid hsl(var(--border));
}

.frame-item {
    position: relative;
    aspect-ratio: 1;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.2s;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &.is-selected {
        border-color: hsl(var(--primary));
        opacity: 1;
    }
    
    &:not(.is-selected) {
        opacity: 0.6;
    }

    .frame-number {
        position: absolute;
        bottom: 2px;
        right: 2px;
        background: rgba(0,0,0,0.6);
        color: white;
        font-size: 0.7rem;
        padding: 1px 4px;
        border-radius: 2px;
    }

    .selection-indicator {
        position: absolute;
        top: 2px;
        left: 2px;
    }
}

.video-preview-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    
    h3 {
        font-family: 'azlando_sans_semiExpanded', sans-serif;
        font-size: 1.25rem;
    }
}

.preview-container {
    width: 600px;
    height: 600px;
    border: 2px solid hsl(var(--border));
    background-color: hsl(var(--card));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);

    img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
}

.video-tools {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
    padding: 1rem 2rem;
    background-color: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    width: 100%;
}

.video-tools__center {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
}

.video-tools__right {
    display: flex;
    justify-content: center;
}

.play-button {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.1s;

    &:active {
        transform: scale(0.95);
    }
}

.fps-control {
    display: flex;
    align-items: center;
    gap: 1rem;
}
</style>