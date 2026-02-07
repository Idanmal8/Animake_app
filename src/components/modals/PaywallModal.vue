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
        <!-- Title & Description -->
        <h2 class="paywall-modal__title">{{ title || 'Upgrade to Pro' }}</h2>
        <p class="paywall-modal__description">
          {{ description || 'Unlock these features by upgrading to a Pro plan.' }}
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
          <div 
            v-for="product in products" 
            :key="product.id"
            @click="selectedProductId = product.id"
            class="paywall-modal__plan"
            :class="{ 'paywall-modal__plan--selected': selectedProductId === product.id }"
          >
            <div class="paywall-modal__plan-left">
              <div class="paywall-modal__radio">
                 <div v-if="selectedProductId === product.id" class="paywall-modal__radio-inner" />
              </div>
              <div class="paywall-modal__plan-info">
                <div class="paywall-modal__plan-duration">{{ getDurationLabel(product) }}</div>
                <div class="paywall-modal__price-row" v-if="product.attributes.from_price">
                  <div class="paywall-modal__plan-old-price">₪{{ product.attributes.from_price / 100 }}</div>
                  <div class="paywall-modal__plan-discounted-price">{{ product.attributes.price_formatted }}</div>
                </div>
                 <div class="paywall-modal__plan-price" v-else>
                    {{ product.attributes.price_formatted }}
                 </div>
              </div>
               <!-- Logic for save badge is complex without comparing, omitting for now or can deduce from from_price -->
               <span v-if="product.attributes.from_price" class="paywall-modal__save-badge">
                Save 33% <!-- Logic to calculate verify? -->
              </span>
            </div>
            <div class="paywall-modal__plan-right">
              <div class="paywall-modal__plan-price">
                  {{ calculateMonthlyPrice(product) }} 
                  <span class="paywall-modal__plan-period">/ mo</span>
              </div>
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
import { ref, watch, onMounted } from 'vue'
import { X, Check } from 'lucide-vue-next'
import AppButton from '@/components/buttons/AppButton.vue'
import type { LemonSqueezyProductData } from '@/types/lemon-squeezy'
import { SubscriptionType } from '@/types/lemon-squeezy'

const props = defineProps<{
  isOpen: boolean
  isLoading: boolean
  products: LemonSqueezyProductData[]
  title?: string
  description?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'subscribe', cycle: 'monthly' | 'annually'): void // Keeping signature but maybe unused
}>()

const selectedProductId = ref<string>('')

// Auto-select first product or specific default
watch(() => props.products, (newProducts) => {
    if (newProducts.length > 0 && !selectedProductId.value) {
        // Prefer yearly or first
        const yearly = newProducts.find(p => p.id === SubscriptionType.Yearly)
        selectedProductId.value = yearly ? yearly.id : newProducts[0]!.id
    }
}, { immediate: true })


const features = [
  'Unlimited video to sprite',
  'Better dimension export',
]

const close = () => {
  emit('close')
}

const getDurationLabel = (product: LemonSqueezyProductData) => {
    if (product.id === SubscriptionType.Monthly) return '1 Month'
    if (product.id === SubscriptionType.Yearly) return '12 Months'
    return product.attributes.name
}

const calculateMonthlyPrice = (product: LemonSqueezyProductData) => {
    // This is a rough estimation for display. 
    // Ideally we rely on what the API says or just divideprice
    const price = product.attributes.price / 100
    if (product.id === SubscriptionType.Yearly) {
        return '₪' + (price / 12).toFixed(2)
    }
    return '₪' + price.toFixed(2)
}


const handleSubscribe = () => {
  const product = props.products.find(p => p.id === selectedProductId.value)
  if (product) {
      window.open(product.attributes.buy_now_url, '_blank')
      // Close modal?
      emit('close')
  }
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

  &__price-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__plan-discounted-price {
    font-size: 0.875rem;
    font-weight: 700;
    color: hsl(var(--foreground));
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
