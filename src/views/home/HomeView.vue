<script setup lang="ts">
import ThemeToggle from '@/components/buttons/ThemeToggle.vue'
import VideoUpload from '@/views/video_upload/VideoUpload.vue'
import HomeAppBar from '@/views/home/components/HomeAppBar.vue'
import { ref } from 'vue'

// Placeholder for condition logic
const showChat = ref(false)
</script>

<template>
  <div class="home-view">
    <div class="home-view__toggle">
      <ThemeToggle />
    </div>
    <HomeAppBar />
    <VideoUpload />
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

  &__toggle {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 200;
  }
}
</style>
