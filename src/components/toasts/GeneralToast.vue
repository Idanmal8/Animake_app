<script setup lang="ts">
import { computed } from 'vue'
import { ToastType } from '@/components/toasts/enums'

interface Props {
  title?: string
  message?: string
  type?: ToastType
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  message: '',
  type: ToastType.Info,
  visible: false,
})

const typeClass = computed(() => {
  const typeMap: Record<ToastType, string> = {
    [ToastType.Success]: 'type-success',
    [ToastType.Error]: 'type-error',
    [ToastType.Warning]: 'type-warning',
    [ToastType.Info]: 'type-info',
  }
  return typeMap[props.type] || 'type-info'
})
</script>

<template>
  <Transition name="toast-slide">
    <div v-if="visible" class="general-toast" :class="typeClass">
      <div class="general-toast__color-indicator"></div>
      <div class="general-toast__content">
        <div v-if="title" class="general-toast__title">{{ title }}</div>
        <div class="general-toast__message">{{ message }}</div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.general-toast {
  display: flex;
  width: 100%;
  max-width: 400px; /* Or adjust as needed for "expand by its own" but usually toasts have a max width */
  min-height: 60px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  /* Ensure it doesn't get squashed */
  flex-shrink: 0;

  &__color-indicator {
    width: 10%;
    flex-shrink: 0;
  }

  &__content {
    width: 90%;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  &__title {
    font-weight: bold;
    font-size: 1rem;
    color: #333;
  }

  &__message {
    font-size: 0.9rem;
    color: #666;
  }

  /* Color Variations */
  &.type-success .general-toast__color-indicator {
    background-color: #4caf50;
  }

  &.type-error .general-toast__color-indicator {
    background-color: #f44336;
  }

  &.type-warning .general-toast__color-indicator {
    background-color: #ff9800;
  }

  &.type-info .general-toast__color-indicator {
    background-color: #2196f3;
  }
}

/* Slide Animation */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition:
    transform 0.4s ease,
    opacity 0.4s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  transform: translateX(-100%); /* Slide from left */
  opacity: 0;
}
</style>
