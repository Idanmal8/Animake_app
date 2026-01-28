<script setup lang="ts">
import { ref } from 'vue'
import ThemeToggle from '@/components/buttons/ThemeToggle.vue'
import HomeAppBar from '@/views/home/components/HomeAppBar.vue'
import VideoUpload from '@/views/video_upload/VideoUpload.vue'
import VideoFramesSlicing from '@/views/video_frames_slicing/VideoFramesSlicing.vue'
import BackgroundChromaKeyRemover from '@/views/background_chroma_key_remover/BackgroundChromaKeyRemover.vue'
import CanvasPicker from '@/views/canvas_picker/CanvasPicker.vue'

const currentStep = ref<'upload' | 'slicing' | 'chroma-key' | 'canvas-picker'>('upload')

const handleContinueToSlicing = () => {
    currentStep.value = 'slicing'
}

const handleContinueToChromaKey = () => {
    currentStep.value = 'chroma-key'
}

const handleContinueToCanvasPicker = () => {
    currentStep.value = 'canvas-picker'
}
</script>

<template>
  <div class="home-view">
    <div class="home-view__toggle">
      <ThemeToggle />
    </div>
    <HomeAppBar />
    
    <main class="home-content">
       <Transition name="fade" mode="out-in">
           <VideoUpload 
                v-if="currentStep === 'upload'" 
                @continue="handleContinueToSlicing" 
            />
           <VideoFramesSlicing 
                v-else-if="currentStep === 'slicing'" 
                @continue="handleContinueToChromaKey"
           />
           <BackgroundChromaKeyRemover 
                v-else-if="currentStep === 'chroma-key'" 
                @continue="handleContinueToCanvasPicker"
            />
           <CanvasPicker v-else-if="currentStep === 'canvas-picker'" />
       </Transition>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
  background-color: hsl(var(--background)); /* Use theme variable */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Align start */
  align-items: center;
  transition: background-color 0.3s ease; /* Smooth background transition */
  padding: 1rem; /* Ensure space for fixed input */

  /* Main content area that scrolls */
  .home-content {
      width: 100%;
      flex: 1;
      // padding-top: 5rem; /* Space for fixed app bar */
      display: flex;
      justify-content: center;
      padding-bottom: 2rem;
  }

  &__toggle {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 200;
  }
}

/* Global fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
