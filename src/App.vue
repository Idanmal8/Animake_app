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
  <RateLimitModal
    :is-visible="toastStore.isRateLimitModalVisible"
    :retry-after="toastStore.rateLimitRetryAfter"
    @close="toastStore.hideRateLimitModal"
  />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import GeneralToast from '@/components/toasts/GeneralToast.vue'
import RateLimitModal from '@/components/modals/RateLimitModal.vue'
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
