<template>
  <div v-if="isVisible" class="rate-limit-modal-overlay">
    <div class="rate-limit-modal">
      <div class="rate-limit-modal__sprite-container">
          <SpriteSheetPlayer
            :src="sweatyCatSprite"
            :frame-width="128"
            :frame-height="128"
            :total-frames="38"
            :cols="24"
            :rows="2"
            :fps="24"
            :playing="true"
          />
      </div>
      <h2 class="rate-limit-modal__title">Too many requests!</h2>
      <p class="rate-limit-modal__description"> Let's rest a little. Please wait before trying again.</p>
      <div v-if="retryAfter" class="rate-limit-modal__timer">
          Retry after: {{ retryAfter }}s
      </div>
      <AppButton
        title="Okay"
        color="hsl(var(--primary))"
        text-color="hsl(var(--primary-foreground))"
        width="100%"
        @click="handleClose"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, watch } from 'vue'
import AppButton from '@/components/buttons/AppButton.vue'
import SpriteSheetPlayer from '@/components/display/SpriteSheetPlayer.vue'
import sweatyCatSprite from '@/assets/sprites/sweaty_cat.webp'
import { analyticsService } from '@/api/services/analytics'

const props = defineProps<{
  isVisible: boolean
  retryAfter?: string | number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('close')
}

watch(() => props.isVisible, (visible) => {
  if (visible) {
    analyticsService.track('rate_limit_shown', { retryAfter: props.retryAfter })
  }
})
</script>

<style scoped lang="scss">
.rate-limit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; // Higher than toast
  backdrop-filter: blur(4px);
}

.rate-limit-modal {
  background-color: white;
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);

  &__sprite-container {
      width: 200px;
      height: 200px;
      margin-bottom: 1.5rem;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
  }

  &__title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: black;
  }

  &__description {
      font-size: 1rem;
      color: #666;
      margin-bottom: 1.5rem;
  }

  &__timer {
      font-weight: bold;
      color: hsl(var(--destructive));
      margin-bottom: 1rem;
  }
}
</style>
