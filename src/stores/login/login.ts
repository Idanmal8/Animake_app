import { ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/api/services/auth'

export const useLoginStore = defineStore('login', () => {
    const email = ref('')
    const password = ref('')

    const login = async () => {
        try {
            const response = await authService.login({
                email: email.value.trim(),
                password: password.value.trim()
            })
            console.log(response)
            if (response.access_token) {
                console.log(response)
                localStorage.setItem('token', response.access_token)
                return true
            }
            return false
        } catch (error) {
            console.error(error)
            return false
        }
    }

    return { email, password, login }

})
