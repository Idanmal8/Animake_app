<script setup lang="ts">
import LargeUploadFileField from '@/components/fields/LargeUploadFileField.vue'
import StepsGuide from './components/StepsGuide.vue'
import RangeSlider from '@/components/inputs/RangeSlider.vue'
import AppButton from '@/components/buttons/AppButton.vue' // Assuming AppButton exists
import { useVideoUploadStore } from '@/stores/video_upload/video_upload'
import { useLoginStore } from '@/stores/login/login'
import { useToastStore } from '@/stores/toast/toast'
import { ToastType } from '@/components/toasts/enums'
import { analyticsService } from '@/api/services/analytics'
import { ref, watch, computed } from 'vue'

const store = useVideoUploadStore()
const loginStore = useLoginStore()
const toastStore = useToastStore()
const videoRef = ref<HTMLVideoElement | null>(null)

const aspectRatio = ref(1.77) // Default 16:9

const onLoadedMetadata = () => {
  if (videoRef.value) {
    const dur = videoRef.value.duration
    
    // Restriction: Max 20 seconds
    if (dur > 20) {
        toastStore.show(
            'Video too long',
            'Please upload a video shorter than 20 seconds.',
            ToastType.Error
        )
        store.reset()
        return
    }

    store.setDuration(dur)
    aspectRatio.value = videoRef.value.videoWidth / videoRef.value.videoHeight
  }
}

// Compute the 'left' percentage for the square crop box
const cropLeftPercent = computed(() => {
    if (aspectRatio.value <= 1) return 0 // Portrait/Square: No horizontal movement (maybe vertical later?)
    
    // Width of square in % of video width = (1 / AR) * 100
    const squareWidthPercent = (1 / aspectRatio.value) * 100
    
    // Available space to move = 100% - SquareWidth
    const availableSpace = 100 - squareWidthPercent
    
    // Position based on offset (0-100)
    return (store.cropOffset / 100) * availableSpace
})

// Compute the width of the square in %
const cropWidthPercent = computed(() => {
    if (aspectRatio.value <= 1) return 100 
    return (1 / aspectRatio.value) * 100
})

const onTimeUpdate = () => {
    if (!videoRef.value || !store.isPlayingPreview) return
    
    if (videoRef.value.currentTime >= store.endTime) {
        videoRef.value.currentTime = store.startTime
        videoRef.value.play()
    }
}

const handleSliderUpdate = (val: [number, number]) => {
    let [newStart, newEnd] = val
    const MAX_DURATION = 3

    // Determine which handle moved
    const oldStart = store.startTime
    const oldEnd = store.endTime
    
    // If user dragged START handle
    if (Math.abs(newStart - oldStart) > 0.01) {
        if (newEnd - newStart > MAX_DURATION) {
            newEnd = newStart + MAX_DURATION
        }
    } 
    // If user dragged END handle
    else if (Math.abs(newEnd - oldEnd) > 0.01) {
        if (newEnd - newStart > MAX_DURATION) {
            newStart = newEnd - MAX_DURATION
        }
    }
    // Edges case: pushed both or initial clamp? Just clamp end.
    if (newEnd - newStart > MAX_DURATION) {
        newEnd = newStart + MAX_DURATION
    }

    store.setTrim(newStart, newEnd)

    // Seek preview if start changed significantly
    if (videoRef.value) {
        if (Math.abs(videoRef.value.currentTime - newStart) > 0.5) {
             videoRef.value.currentTime = newStart
        }
    }
}

const togglePreviewLoop = () => {
    if(!videoRef.value) return;
    
    if(store.isPlayingPreview) {
        videoRef.value.pause()
        store.togglePreview(false)
    } else {
        videoRef.value.currentTime = store.startTime
        videoRef.value.play()
        store.togglePreview(true)
    }
}

const emit = defineEmits<{
    (e: 'continue'): void
    (e: 'show-paywall', payload: { title: string, description: string }): void
}>()

const handleContinue = () => {
    console.log('continue')
    emit('continue')
}

// Check trial consumption on file upload
watch(() => store.videoFile, (file) => {
    if (file) {
        analyticsService.track('video_selected', { 
            name: file.name,
            size: file.size,
            type: file.type
        })

        if (!loginStore.isSubscribed && loginStore.trialUsage && loginStore.trialUsage.remaining <= 0) {
            // Reset the file immediately
            store.reset()
            
            // Show paywall modal
            emit('show-paywall', {
                title: 'Free Trial Ended',
                description: 'You have run out of free trial attempts. Upgrade to start a new project.'
            })
        }
    }
})

// Watch play state to handle pause from native controls
watch(() => store.isPlayingPreview, (isPlaying) => {
    if(!isPlaying && videoRef.value && !videoRef.value.paused) {
        videoRef.value.pause()
    }
})

</script>

<template>
    <div class="video-upload-view">
        <Transition name="fade" mode="out-in">
            <div v-if="!store.videoFile" class="video-upload-view__upload-state">
                <LargeUploadFileField />
                <StepsGuide />
            </div>
            
            <div v-else class="video-upload-view__preview-state">
                <div class="video-wrapper">
                    <video 
                        ref="videoRef"
                        :src="store.thumbnailUrl || ''" 
                        controls 
                        class="uploaded-video"
                        @loadedmetadata="onLoadedMetadata"
                        @timeupdate="onTimeUpdate"
                    />
                    
                    <!-- Crop Overlay -->
                    <div class="crop-overlay" v-if="store.isCropped">
                         <div 
                            class="crop-box"
                            :style="{ 
                                left: `${cropLeftPercent}%`, 
                                width: `${cropWidthPercent}%` 
                            }"
                         ></div>
                    </div>
                </div>

                <div class="trim-controls" v-if="store.duration > 0">
                    <RangeSlider 
                        :min="0" 
                        :max="store.duration" 
                        :model-value="[store.startTime, store.endTime]"
                        @update:model-value="handleSliderUpdate"
                    />
                    
                    <div class="action-buttons">
                        <AppButton 
                            :title="store.isPlayingPreview ? 'Stop Loop' : 'Preview Loop'"
                            @click="togglePreviewLoop"
                            variant="secondary"
                            min-width="140px"
                        />
                         <AppButton 
                            title="Continue"
                            @click="handleContinue"
                            color="hsl(var(--primary))"
                            text-color="hsl(var(--primary-foreground))"
                            min-width="140px"
                        />
                    </div>
                </div>
                
                <!-- Crop Controls -->
                <div class="crop-controls">
                    <label class="crop-toggle">
                        <input type="checkbox" v-model="store.isCropped">
                        <span class="label-text">Crop to Square (1:1)</span>
                    </label>
                    
                    <div class="crop-slider" v-if="store.isCropped">
                        <span class="label-text">Position</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            v-model.number="store.cropOffset"
                        >
                    </div>
                </div>


                <!-- Temporary Reset Button moved to bottom/removed in favor of proper flow if needed, 
                     but keeping simple reset logic accessible for dev/demo -->
                 <button @click="store.reset" class="reset-btn">Upload Another Video</button>
            </div>
        </Transition>
    </div>
</template>

<style lang="scss" scoped>
.video-upload-view {
    width: 100%;
    /* Ensure content is centered or laid out correctly */
}

.trim-controls {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
}

.video-wrapper {
    width: 100%;
    max-width: 800px;
    margin: 2rem auto;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    background-color: black;
}

.uploaded-video {
    width: 100%;
    height: auto;
    display: block;
    max-height: 70vh;
}

.reset-btn {
    display: block;
    margin: 1rem auto;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
    cursor: pointer;
    color: hsl(var(--muted-foreground));
    transition: all 0.2s;

    &:hover {
        background-color: hsl(var(--muted));
        color: hsl(var(--foreground));
    }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.video-wrapper {
    position: relative; /* Context for overlay */
    /* ... existing ... */
}

.crop-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Let clicks pass through to video controls if needed, or handle custom dragging */
}

.crop-box {
    position: absolute;
    top: 0;
    height: 100%;
    /* Width set by inline style */
    border: 2px solid white;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7); /* Dim everything else */
    pointer-events: auto; /* Maybe allow dragging here in future? */
}

.crop-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    margin-top: 1rem;
    padding: 1rem;
    background: hsl(var(--card));
    border-radius: 8px;
    border: 1px solid hsl(var(--border));
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.crop-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 500;
}

.crop-slider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    max-width: 300px;
}

.label-text {
    font-size: 0.9rem;
}
</style>