import { ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/api/services/auth'
import { analyticsService } from '@/api/services/analytics'

import { subscriptionService, type Subscription } from '@/api/services/subscription'
import { paymentService } from '@/api/services/payment'
import type { TrialUsageResponse } from '@/types/payment'

export const useLoginStore = defineStore('login', () => {
  const email = ref('')
  const password = ref('')
  const userId = ref<number | null>(null)
  const isSubscribed = ref(false)
  const subscription = ref<Subscription | null>(null)

  const signUp = async (fullName: string) => {
    try {
      // 1. Register
      const registerResponse = await authService.register({
        email: email.value.trim(),
        password: password.value.trim(),
        fullName: fullName.trim(),
      })

      if (registerResponse) {
        // 2. Login to get token
        const loginSuccess = await login()
        if (loginSuccess) {
          analyticsService.track('user_signed_up', { method: 'email' })
        }
        return loginSuccess
      }
      return false
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const login = async () => {
    try {
      const response = await authService.login({
        email: email.value.trim(),
        password: password.value.trim(),
      })
      console.log(response)
      if (response.access_token) {
        localStorage.setItem('token', response.access_token)
        if (response.user) {
          userId.value = response.user.id
          localStorage.setItem('user', JSON.stringify(response.user))
          try {
            const sub = await subscriptionService.getSubscription(response.user.id)
            if (sub && sub.isActive) {
              isSubscribed.value = true
              subscription.value = sub
            } else {
              isSubscribed.value = false
              subscription.value = null
            }
            // Fetch trial usage
            await fetchTrialUsage()
          } catch (err) {
            isSubscribed.value = false
            subscription.value = null
          }
        }

        // Identify User in PostHog
        if (response.user) {
          analyticsService.identify(response.user.id, response.user.email)
          analyticsService.track('user_logged_in', { method: 'email' })
        }

        return true
      }
      return false
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const isInitializing = ref(true)

  const initialize = async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    console.log(storedUser)

    try {
      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser)
          if (user && user.id) {
            userId.value = user.id
            if (user.email) email.value = user.email
            // Fetch subscription
            try {
              const sub = await subscriptionService.getSubscription(user.id)
              if (sub && sub.isActive) {
                isSubscribed.value = true
                subscription.value = sub
              } else {
                isSubscribed.value = false
                subscription.value = null
              }
              // Fetch trial usage
              await fetchTrialUsage()
            } catch (err) {
              isSubscribed.value = false
              subscription.value = null
            }
          }
        } catch (e) {
          // If parsing fails, maybe clear storage?
          console.error('Failed to parse stored user', e)
        }
      }
    } finally {
      isInitializing.value = false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    userId.value = null
    isSubscribed.value = false
    subscription.value = null
    email.value = ''
    password.value = ''

    analyticsService.reset()
  }

  const trialUsage = ref<TrialUsageResponse | null>(null)

  const fetchTrialUsage = async () => {
    if (!userId.value) return
    try {
      const usage = await paymentService.getTrialUsage(userId.value)
      if (usage) {
        trialUsage.value = usage
      }
    } catch (error) {
      console.error('Failed to fetch trial usage', error)
    }
  }

  const incrementTrialUsage = async () => {
    if (!userId.value || !email.value) return //the user does not have an email for now
    try {
      const usage = await paymentService.incrementTrialUsage({
        userId: userId.value,
        userEmail: email.value,
      })
      if (usage) {
        trialUsage.value = usage
      }
    } catch (error) {
      console.error('Failed to increment trial usage', error)
    }
  }

  return {
    email,
    password,
    login,
    userId,
    isSubscribed,
    subscription,
    initialize,
    isInitializing,
    logout,
    trialUsage,
    fetchTrialUsage,
    incrementTrialUsage,
    signUp,
  }
})
