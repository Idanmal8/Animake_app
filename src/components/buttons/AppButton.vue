<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="app-button"
    :style="{
      backgroundColor: color,
      color: textColor,
      borderColor: borderColor,
      minWidth: minWidth,
    }"
  >
    <div v-if="loading" class="spinner"></div>
    <div v-else class="content">
      <div v-if="icon || $slots.leading" class="icon leading">
        <img v-if="icon" :src="icon" alt="icon" />
        <slot v-else name="leading"></slot>
      </div>
      <span class="title">{{ title }}</span>
      <div v-if="$slots.trailing" class="icon trailing">
        <slot name="trailing"></slot>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
interface Props {
  title: string
  icon?: string
  loading?: boolean
  color?: string
  textColor?: string
  borderColor?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  minWidth?: string
  maxWidth?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  color: '#000000',
  textColor: '#ffffff',
  borderColor: 'transparent',
  type: 'button',
  disabled: false,
  minWidth: '400px',
  maxWidth: '400px',
})
</script>

<style scoped lang="scss">
.app-button {
  padding: 0.5rem;
  border-radius: 8px;
  height: 40px;
  border-width: 1px;
  border-style: solid;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.title {
  font-weight: bold;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: currentColor;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
