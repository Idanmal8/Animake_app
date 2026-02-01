import { ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/api/services/auth'

import { subscriptionService, type Subscription } from '@/api/services/subscription'

export const useLoginStore = defineStore('login', () => {
    const email = ref('')
    const password = ref('')
    const userId = ref<number | null>(null)
    const isSubscribed = ref(false)
    const subscription = ref<Subscription | null>(null)

    const login = async () => {
        try {
            const response = await authService.login({
                email: email.value.trim(),
                password: password.value.trim()
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
                    } catch (err) {
                        isSubscribed.value = false
                        subscription.value = null
                    }
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
        
        try {
            if (token && storedUser) {
                try {
                    const user = JSON.parse(storedUser)
                    if (user && user.id) {
                        userId.value = user.id
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
    }

    return { email, password, login, userId, isSubscribed, subscription, initialize, isInitializing, logout }

})
