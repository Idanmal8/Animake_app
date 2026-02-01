<template>
  <div v-if="isOpen" class="paywall-modal" @click.self="close">
    <div class="paywall-modal__content animate-in fade-in zoom-in-95 duration-200">
      <!-- Close button -->
      <button @click="close" class="paywall-modal__close">
        <X :size="20" />
      </button>

      <div class="paywall-modal__body">
        <!-- Pro Badge -->
        <div class="paywall-modal__badge">
          Pro
        </div>

        <!-- Title & Description -->
        <h2 class="paywall-modal__title">Upgrade to Pro</h2>
        <p class="paywall-modal__description">
          Unlock these features by upgrading to a Pro plan.
        </p>

        <!-- Features List -->
        <div class="paywall-modal__features">
          <div v-for="(feature, index) in features" :key="index" class="paywall-modal__feature">
            <Check :size="16" class="paywall-modal__feature-icon" />
            <span>{{ feature }}</span>
          </div>
        </div>

        <!-- Plans Selection -->
        <div class="paywall-modal__plans">
          <!-- Annual Plan -->
          <div 
            @click="selectedCycle = 'annually'"
            class="paywall-modal__plan"
            :class="{ 'paywall-modal__plan--selected': selectedCycle === 'annually' }"
          >
            <div class="paywall-modal__plan-left">
              <div class="paywall-modal__radio">
                 <div v-if="selectedCycle === 'annually'" class="paywall-modal__radio-inner" />
              </div>
              <div class="paywall-modal__plan-info">
                <div class="paywall-modal__plan-duration">12 months</div>
                <div class="paywall-modal__plan-old-price">$84.00</div>
              </div>
              <span class="paywall-modal__save-badge">
                Save 33%
              </span>
            </div>
            <div class="paywall-modal__plan-right">
              <div class="paywall-modal__plan-price">$4.67 <span class="paywall-modal__plan-period">/ mo</span></div>
            </div>
          </div>

          <!-- Monthly Plan -->
          <div 
            @click="selectedCycle = 'monthly'"
            class="paywall-modal__plan"
            :class="{ 'paywall-modal__plan--selected': selectedCycle === 'monthly' }"
          >
            <div class="paywall-modal__plan-left">
              <div class="paywall-modal__radio">
                <div v-if="selectedCycle === 'monthly'" class="paywall-modal__radio-inner" />
              </div>
              <div class="paywall-modal__plan-info">
                <div class="paywall-modal__plan-duration">1 month</div>
              </div>
            </div>
            <div class="paywall-modal__plan-right">
              <div class="paywall-modal__plan-price">$7.00 <span class="paywall-modal__plan-period">/ mo</span></div>
            </div>
          </div>
        </div>

        <!-- Subscribe Button -->
        <div class="paywall-modal__footer">
          <AppButton
            :title="isLoading ? 'Processing...' : 'Subscribe'"
            :loading="isLoading"
            type="button"
            color="hsl(var(--primary))"
            text-color="hsl(var(--primary-foreground))"
            width="100%"
            @click="handleSubscribe"
          />

          <p class="paywall-modal__cancel-text">
            Cancel anytime from your billing page.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X, Check } from 'lucide-vue-next'
import AppButton from '@/components/buttons/AppButton.vue'

const props = defineProps<{
  isOpen: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'subscribe', cycle: 'monthly' | 'annually'): void
}>()

const selectedCycle = ref<'monthly' | 'annually'>('annually')

const features = [
  'Unlimited video to sprite',
  'Better dimension export',
]

const close = () => {
  emit('close')
}

const handleSubscribe = () => {
  emit('subscribe', selectedCycle.value)
}
</script>

<style lang="scss" scoped>
.paywall-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);

  &__content {
    position: relative;
    width: 100%;
    max-width: 28rem; // max-w-md
    background-color: hsl(var(--card));
    border-radius: 0.75rem; // rounded-xl
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  &__close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    color: hsl(var(--muted-foreground));
    transition: color 0.2s;
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      color: hsl(var(--foreground));
    }
  }

  &__body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__badge {
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.25rem 1rem;
    border-radius: 9999px;
    margin-bottom: 1rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: hsl(var(--foreground));
  }

  &__description {
    color: hsl(var(--muted-foreground));
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  &__features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    row-gap: 0.75rem;
    column-gap: 1rem;
    margin-bottom: 2rem;
    width: 100%;
    text-align: left;
  }

  &__feature {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: hsl(var(--foreground));
  }

  &__feature-icon {
    margin-top: 0.125rem;
    color: #22c55e; // text-green-500
    flex-shrink: 0;
  }

  &__plans {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  &__plan {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 2px solid hsl(var(--border));
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: rgba(0, 0, 0, 0.2); // approximation of primary/50
    }

    &--selected {
      border-color: hsl(var(--primary));
      background-color: rgba(0, 0, 0, 0.05); // approximation of primary/5
      
      .paywall-modal__radio {
        border-color: hsl(var(--primary));
      }
    }
  }

  &__plan-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__radio {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 9999px;
    border: 2px solid hsl(var(--muted-foreground));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;
  }

  &__radio-inner {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 9999px;
    background-color: hsl(var(--primary));
  }

  &__plan-info {
    text-align: left;
  }

  &__plan-duration {
    font-weight: 700;
    color: hsl(var(--foreground));
  }

  &__plan-old-price {
    font-size: 0.75rem;
    color: hsl(var(--muted-foreground));
    text-decoration: line-through;
  }

  &__save-badge {
    background-color: #10b981; // emerald-500
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    margin-left: 0.5rem;
  }

  &__plan-right {
    text-align: right;
  }

  &__plan-price {
    font-weight: 700;
    font-size: 1.125rem;
    color: hsl(var(--foreground));
  }

  &__plan-period {
    font-size: 0.875rem;
    font-weight: 400;
    color: hsl(var(--muted-foreground));
  }

  &__footer {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  &__cancel-text {
    margin-top: 1rem;
    font-size: 0.75rem;
    color: hsl(var(--muted-foreground));
  }
}
</style>
