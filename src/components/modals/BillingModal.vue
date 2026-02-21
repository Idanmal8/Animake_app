<template>
  <div v-if="isOpen" class="billing-modal" @click.self="close">
    <div class="billing-modal__content animate-in fade-in zoom-in-95 duration-200">
      <!-- Close button -->
      <button @click="close" class="billing-modal__close">
        <X :size="20" />
      </button>

      <div class="billing-modal__body">
        <h2 class="billing-modal__title">Subscription</h2>
        
        <div v-if="subscription" class="billing-modal__details">
            <div class="billing-modal__row">
                <span class="billing-modal__label">Plan:</span>
                <span class="billing-modal__value capitalize">{{ subscription.cycle }}</span>
            </div>
             <div class="billing-modal__row">
                <span class="billing-modal__label">Status:</span>
                <span class="billing-modal__value status-active" v-if="subscription.isActive">Active</span>
                <span class="billing-modal__value status-inactive" v-else>Expired</span>
            </div>
             <div class="billing-modal__row" v-if="subscription.isActive && subscription.autoRenewal">
                <span class="billing-modal__label">Need to renew:</span>
                <span class="billing-modal__value">{{ formatDate(subscription.endDate) }}</span>
            </div>
             <div class="billing-modal__row" v-else-if="subscription.isActive && !subscription.autoRenewal">
                <span class="billing-modal__label">Expires on:</span>
                <span class="billing-modal__value">{{ formatDate(subscription.endDate) }}</span>
            </div>
             <div class="billing-modal__row" v-else>
                <span class="billing-modal__label">Expired on:</span>
                <span class="billing-modal__value">{{ formatDate(subscription.endDate) }}</span>
            </div>
        </div>
        <div v-else class="billing-modal__empty">
            No active subscription found.
        </div>
        <div class="billing-modal__footer" v-if="subscription && subscription.isActive && subscription.autoRenewal">
             <AppButton
                title="Cancel Subscription"
                :loading="isLoading"
                type="button"
                color="hsl(var(--destructive))"
                text-color="hsl(var(--destructive-foreground))"
                width="100%"
                @click="handleCancel"
            />
             <p class="billing-modal__cancel-note">
                Your subscription will remain active until the end of the current billing period.
            </p>
        </div>
        <div class="billing-modal__footer" v-else-if="subscription && subscription.isActive && !subscription.autoRenewal">
             <div class="billing-modal__canceled-notice">
                 Your subscription has been canceled. The cancellation will take effect on the renewal date: <strong>{{ formatDate(subscription.endDate) }}</strong>.
             </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import AppButton from '@/components/buttons/AppButton.vue'
import type { Subscription } from '@/api/services/subscription'

const props = defineProps<{
  isOpen: boolean
  isLoading: boolean
  subscription: Subscription | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'cancel'): void
}>()

const close = () => {
  emit('close')
}

const handleCancel = () => {
    emit('cancel')
}

const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}
</script>

<style lang="scss" scoped>
.billing-modal {
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
    max-width: 24rem; // max-w-sm
    background-color: hsl(var(--card));
    border-radius: 0.75rem; // rounded-xl
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 1.5rem;
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
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: hsl(var(--foreground));
  }

  &__details {
      width: 100%;
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
  }

  &__row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
  }

  &__label {
      color: hsl(var(--muted-foreground));
      font-weight: 500;
  }
  
  &__value {
      color: hsl(var(--foreground));
      font-weight: 600;

      &.capitalize {
          text-transform: capitalize;
      }

      &.status-active {
          color: #10b981;
      }

      &.status-inactive {
          color: hsl(var(--muted-foreground));
      }
      
      &.text-green {
          color: #10b981;
      }
      
      &.text-red {
          color: #ef4444;
      }
  }

  &__empty {
      color: hsl(var(--muted-foreground));
      margin-bottom: 2rem;
  }

  &__footer {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

  &__cancel-note {
      font-size: 0.75rem;
      color: hsl(var(--muted-foreground));
      text-align: center;
      margin-top: 0.5rem;
  }

  &__canceled-notice {
      font-size: 0.875rem;
      color: #d97706; // amber-600
      text-align: center;
      margin-top: 0.5rem;
      background: rgba(245, 158, 11, 0.1);
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(245, 158, 11, 0.2);
      line-height: 1.4;
      
      strong {
          font-weight: 600;
          color: #b45309; // amber-700
      }
  }
}
</style>
