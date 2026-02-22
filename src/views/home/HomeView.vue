<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ThemeToggle from '@/components/buttons/ThemeToggle.vue'
import HomeAppBar from '@/views/home/components/HomeAppBar.vue'
import VideoUpload from '@/views/video_upload/VideoUpload.vue'
import VideoFramesSlicing from '@/views/video_frames_slicing/VideoFramesSlicing.vue'
import BackgroundChromaKeyRemover from '@/views/background_chroma_key_remover/BackgroundChromaKeyRemover.vue'
import CanvasPicker from '@/views/canvas_picker/CanvasPicker.vue'
import PaywallModal from '@/components/modals/PaywallModal.vue'
import BillingModal from '@/components/modals/BillingModal.vue'
import { subscriptionService } from '@/api/services/subscription'
import { useLoginStore } from '@/stores/login/login'
import { useProductStore } from '@/stores/products/products'
import { analyticsService } from '@/api/services/analytics'
import { Loader2 } from 'lucide-vue-next'

const loginStore = useLoginStore()
const productStore = useProductStore()
const isLoading = ref(true)
const currentStep = ref<'upload' | 'slicing' | 'chroma-key' | 'canvas-picker'>('upload')

const refreshSubscription = async () => {
    if (loginStore.userId) {
        try {
            const freshSub = await subscriptionService.getSubscription(loginStore.userId)
            if (freshSub) {
                loginStore.isSubscribed = freshSub.isActive
                loginStore.subscription = freshSub
                if (freshSub.isActive) {
                    isPaywallOpen.value = false
                }
            }
        } catch (e) {
            console.error('Failed to refresh subscription', e)
        }
    }
}

onMounted(async () => {
    try {
        await loginStore.initialize()
        await Promise.all([
            productStore.fetchProducts(),
            loginStore.fetchTrialUsage(),
            refreshSubscription()
        ])
    } finally {
        isLoading.value = false
    }
})
const isPaywallOpen = ref(false)
const isSubscribing = ref(false)
const isBillingOpen = ref(false)
const isCancelling = ref(false)
const paywallTitle = ref('')
const paywallDescription = ref('')

const handleShowPaywall = (payload?: { title?: string, description?: string }) => {
    paywallTitle.value = payload?.title || ''
    paywallDescription.value = payload?.description || ''
    isPaywallOpen.value = true
    analyticsService.track('paywall_shown', { title: payload?.title })
}

const handleContinueToSlicing = () => {
    currentStep.value = 'slicing'
    analyticsService.track('flow_step_complete', { step: 'upload', next: 'slicing' })
}

const handleContinueToChromaKey = () => {
    currentStep.value = 'chroma-key'
    analyticsService.track('flow_step_complete', { step: 'slicing', next: 'chroma_key' })
}

const handleContinueToCanvasPicker = () => {
    currentStep.value = 'canvas-picker'
    analyticsService.track('flow_step_complete', { step: 'chroma_key', next: 'canvas_picker' })
}

const handleBackToUpload = () => {
    analyticsService.track('flow_step_back', { from: 'slicing', to: 'upload' })
    currentStep.value = 'upload'
}

const handleBackToSlicing = () => {
    analyticsService.track('flow_step_back', { from: 'chroma_key', to: 'slicing' })
    currentStep.value = 'slicing'
}

const handleBackToChromaKey = () => {
    analyticsService.track('flow_step_back', { from: 'canvas_picker', to: 'chroma_key' })
    currentStep.value = 'chroma-key'
}

const handleSubscribe = async (cycle: 'monthly' | 'annually') => {
    if (!loginStore.userId) return // Should be logged in to see button? Or redirect to login
    
    analyticsService.track('purchase_clicked', { cycle })

    isSubscribing.value = true
    try {
        const sub = await subscriptionService.createSubscription({
             userId: loginStore.userId,
             cycle
        })
        if (sub) {
             // Refetch subscription to ensure fresh data for billing modal
             const freshSub = await subscriptionService.getSubscription(loginStore.userId)             
             if (freshSub) {
                loginStore.isSubscribed = true
                loginStore.subscription = freshSub
                isPaywallOpen.value = false
             }
        }
    } catch (error) {
        console.error('Subscription failed', error)
        // Show error toast
    } finally {
        isSubscribing.value = false
    }
}

const handleCancelSubscription = async () => {
    if (!loginStore.userId) return
    isCancelling.value = true
    try {
        const sub = await subscriptionService.cancelSubscription(loginStore.userId)
        if (sub) {
             // Update local subscription object
             loginStore.subscription = sub
             // If isActive became false (immediate cancel), update isSubscribed
             if (!sub.isActive) {
                 loginStore.isSubscribed = false
             }
        }
    } catch (error) {
        console.error('Cancellation failed', error)
    } finally {
        isCancelling.value = false
    }
}
</script>

<template>
  <div class="home-view">
    <div v-if="isLoading" class="home-view__loading-overlay">
        <Loader2 class="home-view__spinner" :size="48" />
    </div>

    <div class="home-view__toggle">
      <ThemeToggle />
    </div>
    <HomeAppBar 
        @purchase="isPaywallOpen = true" 
        @open-billing="isBillingOpen = true"
    />
    <PaywallModal 
      :is-open="isPaywallOpen"
      :is-loading="isSubscribing"
      :products="productStore.products"
      :title="paywallTitle"
      :description="paywallDescription"
      :user-email="loginStore.email"
      @close="isPaywallOpen = false"
      @subscribe="handleSubscribe"
    />
    <BillingModal
        :is-open="isBillingOpen"
        :is-loading="isCancelling"
        :subscription="loginStore.subscription"
        @close="isBillingOpen = false"
        @cancel="handleCancelSubscription"
    />
    
    
    <main class="home-content">
       <Transition name="fade" mode="out-in">
           <VideoUpload 
                v-if="currentStep === 'upload'" 
                @continue="handleContinueToSlicing" 
                @show-paywall="handleShowPaywall"
            />
           <VideoFramesSlicing 
                v-else-if="currentStep === 'slicing'" 
                @continue="handleContinueToChromaKey"
                @back="handleBackToUpload"
           />
           <BackgroundChromaKeyRemover 
                v-else-if="currentStep === 'chroma-key'" 
                @continue="handleContinueToCanvasPicker"
                @back="handleBackToSlicing"
            />
           <CanvasPicker 
                v-else-if="currentStep === 'canvas-picker'"
                @back="handleBackToChromaKey"
                @show-paywall="handleShowPaywall"
            />
       </Transition>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
  background-color: hsl(var(--background)); /* Use theme variable */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Align start */
  align-items: center;
  transition: background-color 0.3s ease; /* Smooth background transition */
  padding: 1rem; /* Ensure space for fixed input */

  &__loading-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background-color: hsl(var(--background));
      display: flex;
      align-items: center;
      justify-content: center;
  }
  
  &__spinner {
      color: hsl(var(--primary));
      animation: spin 1s linear infinite;
  }

  @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
  }

  /* Main content area that scrolls */
  .home-content {
      width: 100%;
      flex: 1;
      // padding-top: 5rem; /* Space for fixed app bar */
      display: flex;
      justify-content: center;
      padding-bottom: 2rem;
  }

  &__toggle {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 200;
  }
}

/* Global fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
