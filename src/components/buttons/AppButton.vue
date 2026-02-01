<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="app-button"
    :style="{
      backgroundColor: finalColor,
      color: finalTextColor,
      borderColor: finalBorderColor,
      minWidth: minWidth,
      width: width,
    }"
    :class="variant"
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
import { computed } from 'vue'

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
  width?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  type: 'button',
  disabled: false,
  minWidth: 'var(--button-min-width, 140px)', // use css var or sensible default
  maxWidth: '400px',
  variant: 'primary'
})

const finalColor = computed(() => {
    if (props.color) return props.color
    switch (props.variant) {
        case 'secondary': return 'hsl(var(--secondary))'
        case 'ghost': return 'transparent'
        case 'outline': return 'transparent' // Background
        case 'destructive': return 'hsl(var(--destructive))'
        default: return 'hsl(var(--primary))'
    }
})

const finalTextColor = computed(() => {
    if (props.textColor) return props.textColor
    switch (props.variant) {
        case 'secondary': return 'hsl(var(--secondary-foreground))'
        case 'ghost': return 'hsl(var(--foreground))'
        case 'outline': return 'hsl(var(--foreground))'
        case 'destructive': return 'hsl(var(--destructive-foreground))'
        default: return 'hsl(var(--primary-foreground))'
    }
})

const finalBorderColor = computed(() => {
    if (props.borderColor) return props.borderColor
    if (props.variant === 'outline') return 'hsl(var(--border))'
    return 'transparent'
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
  transition: all 0.2s;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  /* Hover effects based on variant */
  &.ghost:hover {
      background-color: hsl(var(--muted)) !important;
  }
  &.outline:hover {
      background-color: hsl(var(--accent)) !important;
  }
  &.primary:hover {
      opacity: 0.9;
  }
  &.secondary:hover {
       filter: brightness(0.95);
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
  border: 2px solid currentColor; /* Use current text color for spinner */
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
