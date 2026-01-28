<script setup lang="ts">
import LargeUploadFileField from '@/components/fields/LargeUploadFileField.vue'
import StepsGuide from './components/StepsGuide.vue'
import RangeSlider from '@/components/inputs/RangeSlider.vue'
import AppButton from '@/components/buttons/AppButton.vue' // Assuming AppButton exists
import { useVideoUploadStore } from '@/stores/video_upload/video_upload'
import { ref, watch } from 'vue'

const store = useVideoUploadStore()
const videoRef = ref<HTMLVideoElement | null>(null)

const onLoadedMetadata = () => {
  if (videoRef.value) {
    store.setDuration(videoRef.value.duration)
  }
}

const onTimeUpdate = () => {
    if (!videoRef.value || !store.isPlayingPreview) return
    
    if (videoRef.value.currentTime >= store.endTime) {
        videoRef.value.currentTime = store.startTime
        videoRef.value.play()
    }
}

const handleSliderUpdate = (val: [number, number]) => {
    store.setTrim(val[0], val[1])
    // If user interacts with slider, pause preview or seek to start of new trim?
    // User requested "preview loop button", so dragging shouldn't auto-play, 
    // but maybe seek video to start handle if dragging left handle?
    if (videoRef.value) {
        if (Math.abs(videoRef.value.currentTime - val[0]) > 0.5) {
             videoRef.value.currentTime = val[0]
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

const handleContinue = () => {
    // Placeholder for next step
    console.log("Continue with trim:", store.startTime, store.endTime)
}

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
</style>