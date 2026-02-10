<template>
  <div class="login-page">
    <div class="login-page__image-container">
      <img :src="background" alt="background" />
    </div>
    <div class="login-page__login-container">
      <h1>{{ isSignUp ? 'Sign Up' : 'Login' }}</h1>
      
      <div v-if="isSignUp" class="login-page__form-group">
        <InputField
          label="Full Name"
          v-model="fullName"
          type="text"
          placeholder="Full Name"
          :rules="nameRules"
          dark
        />
      </div>

      <div class="login-page__form-group">
        <InputField
          label="Email"
          v-model="email"
          type="email"
          placeholder="Email"
          :rules="emailRules"
          dark
        />
      </div>
      <div class="login-page__form-group">
        <InputField
          label="Password"
          v-model="password"
          type="password"
          placeholder="Password"
          :rules="passwordRules"
          dark
        />
      </div>
      <div class="login-page__form-group">
        <AppButton
          :title="isSignUp ? 'Sign Up' : 'Login'"
          type="submit"
          :loading="loading"
          color="#ffffff"
          text-color="#000000"
          width="100%"
          @click.prevent="handleSubmit"
        />
      </div>

      <div class="login-page__toggle-text">
        <span v-if="isSignUp">
          Already have an account? <a href="#" @click.prevent="toggleMode">Login</a>
        </span>
        <span v-else>
          Don't have an account? <a href="#" @click.prevent="toggleMode">Sign Up</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginStore } from '@/stores/login/login'
import { useToastStore } from '@/stores/toast/toast'
import InputField from '@/components/fields/InputField.vue'
import AppButton from '@/components/buttons/AppButton.vue'
import { ToastType } from '@/components/toasts/enums'
import background from '@/assets/login/gradient-background.jpg'

const router = useRouter()
const loginStore = useLoginStore()
const toastStore = useToastStore()

const isSignUp = ref(false)
const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)

const toggleMode = () => {
    isSignUp.value = !isSignUp.value
    // Clear fields maybe?
}

const handleSubmit = async () => {
  loading.value = true
  loginStore.email = email.value
  loginStore.password = password.value
  
  let success = false
  if (isSignUp.value) {
      if (!fullName.value) {
          toastStore.show('Error', 'Full Name is required', ToastType.Error)
          loading.value = false
          return
      }
      success = await loginStore.signUp(fullName.value)
  } else {
      success = await loginStore.login()
  }

  loading.value = false

  if (success) {
    toastStore.show('Success', `${isSignUp.value ? 'Sign Up' : 'Login'} successful! Redirecting...`, ToastType.Success)
    router.push({ name: 'home' })
  } else {
    toastStore.show('Error', `${isSignUp.value ? 'Sign Up' : 'Login'} failed. Please check your details.`, ToastType.Error)
  }
}

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
]

const nameRules = [
    (v: string) => !!v || 'Name is required'
]
</script>

<style scoped lang="scss">
h1 {
  font-size: x-large;
  color: white;
}

input {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.login-page {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  gap: 1rem;
  padding: 1rem;
  box-sizing: border-box;
  background-color: black;
  color: white;

  &__login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex: 1;
    height: 100%;
  }

  &__form-group {
    width: 100%;
    max-width: 400px;
  }

  &__image-container {
    flex: 1;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  &__toggle-text {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #666;

    a {
      color: white;
      font-weight: bold;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
