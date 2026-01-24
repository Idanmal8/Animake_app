<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  label: string
  id?: string
  placeholder?: string
  type?: string
  errorMessage?: string
  rules?: Array<(value: any) => string | boolean>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  id: () => `input-${Math.random().toString(36).substr(2, 9)}`,
  rules: () => [],
})

const model = defineModel<string | number>()
const innerErrorMessage = ref<string>('')

const validate = () => {
  innerErrorMessage.value = ''
  for (const rule of props.rules) {
    const result = rule(model.value)
    if (typeof result === 'string') {
      innerErrorMessage.value = result
      return false
    }
  }
  return true
}

// Validate on input change
watch(model, () => {
  validate()
})

const displayError = computed(() => props.errorMessage || innerErrorMessage.value)
</script>

<template>
  <div class="input-field">
    <label :for="id" class="label">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :class="{ 'has-error': displayError }"
      class="input"
      @blur="validate"
    />
    <span v-if="displayError" class="error-message">{{ displayError }}</span>
  </div>
</template>

<style scoped lang="scss">
.input-field {
  display: flex;
  flex-direction: column;
  min-width: 300px;
}

.label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #000000ff;
  margin-bottom: 0.5rem;
}

.input {
  padding: 0.5rem;
  border: 1px solid transparent;
  background-color: #f5f7fb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  width: 100%;

  &::placeholder {
    color: #9ca3af;
    opacity: 1;
    font-size: 0.8rem;
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary, #ef8f4a);
  }

  &.has-error {
    margin-bottom: 0.5rem;
    border-color: #ad262d;
  }
}

.error-message {
  font-size: 0.8rem;
  color: #ad262d;
}
</style>
