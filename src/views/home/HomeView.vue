<script setup lang="ts">
import ThemeToggle from '@/components/buttons/ThemeToggle.vue'
import HomeAppBar from '@/views/home/components/HomeAppBar.vue'
import HomeChat from '@/views/home/components/HomeChat.vue'
</script>

<template>
  <div class="home-view">
    <div class="home-view__toggle">
      <ThemeToggle />
    </div>
    <HomeAppBar />
    <HomeChat />
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  width: 100%;
  height: 100vh;
  background-color: hsl(var(--background)); /* Use theme variable */
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease; /* Smooth background transition */

  &__toggle {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 200;
  }
}
</style>
