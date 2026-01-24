<template>
  <RouterView />
  <div class="toast-container">
    <GeneralToast
      :visible="toastStore.visible"
      :title="toastStore.title"
      :message="toastStore.message"
      :type="toastStore.type"
    />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import GeneralToast from '@/components/toasts/GeneralToast.vue'
import { useToastStore } from '@/stores/toast/toast'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 1000;
}
</style>
