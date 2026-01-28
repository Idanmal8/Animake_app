<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  min: number
  max: number
  modelValue: [number, number]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: [number, number]): void
}>()

const sliderRef = ref<HTMLElement | null>(null)
const isDraggingLeft = ref(false)
const isDraggingRight = ref(false)

// Convert value to percentage for positioning
const getPercent = (value: number) => {
  return ((value - props.min) / (props.max - props.min)) * 100
}

const leftPercent = computed(() => getPercent(props.modelValue[0]))
const rightPercent = computed(() => getPercent(props.modelValue[1]))

// Handle dragging logic
const handleMouseMove = (event: MouseEvent) => {
  if (!sliderRef.value) return
  const rect = sliderRef.value.getBoundingClientRect()
  const percent = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
  const value = percent * (props.max - props.min) + props.min

  if (isDraggingLeft.value) {
    const newValue = Math.min(value, props.modelValue[1] - 0.1) // Prevent crossing
    emit('update:modelValue', [newValue, props.modelValue[1]])
  } else if (isDraggingRight.value) {
    const newValue = Math.max(value, props.modelValue[0] + 0.1) // Prevent crossing
    emit('update:modelValue', [props.modelValue[0], newValue])
  }
}

const stopDrag = () => {
  isDraggingLeft.value = false
  isDraggingRight.value = false
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', stopDrag)
}

const startDragLeft = () => {
  isDraggingLeft.value = true
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', stopDrag)
}

const startDragRight = () => {
  isDraggingRight.value = true
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', stopDrag)
}
</script>

<template>
  <div class="range-slider" ref="sliderRef">
    <div class="range-slider__track"></div>
    <div 
      class="range-slider__range"
      :style="{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }"
    ></div>
    
    <!-- Left Thumb -->
    <div 
      class="range-slider__thumb range-slider__thumb--left"
      :style="{ left: `${leftPercent}%` }"
      @mousedown.prevent="startDragLeft"
    >
      <div class="range-slider__tooltip">{{ modelValue[0].toFixed(1) }}s</div>
    </div>

    <!-- Right Thumb -->
    <div 
      class="range-slider__thumb range-slider__thumb--right"
      :style="{ left: `${rightPercent}%` }"
      @mousedown.prevent="startDragRight"
    >
      <div class="range-slider__tooltip">{{ modelValue[1].toFixed(1) }}s</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.range-slider {
  position: relative;
  width: 100%;
  height: 6px;
  margin: 2rem 0;
  user-select: none;

  &__track {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: hsl(var(--secondary));
    border-radius: 3px;
  }

  &__range {
    position: absolute;
    height: 100%;
    background-color: hsl(var(--primary));
    border-radius: 3px;
  }

  &__thumb {
    position: absolute;
    top: 50%;
    width: 16px;
    height: 16px;
    background-color: hsl(var(--background));
    border: 2px solid hsl(var(--primary));
    border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 2;
    transition: transform 0.1s;

    &:hover, &:active {
      transform: translate(-50%, -50%) scale(1.2);
    }
  }

  &__tooltip {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }

  &__thumb:hover &__tooltip,
  &__thumb:active &__tooltip {
    opacity: 1;
  }
}
</style>
