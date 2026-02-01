<template>
  <div class="login-page">
    <div class="login-page__image-container">
      <img :src="background" alt="background" />
    </div>
    <div class="login-page__login-container">
      <h1>Login</h1>
      <div class="login-page__form-group">
        <InputField
          label="Email"
          v-model="email"
          type="email"
          placeholder="Email"
          :rules="emailRules"
        />
      </div>
      <div class="login-page__form-group">
        <InputField
          label="Password"
          v-model="password"
          type="password"
          placeholder="Password"
          :rules="passwordRules"
        />
      </div>
      <div class="login-page__form-group">
        <AppButton
          title="Login"
          type="submit"
          :loading="loading"
          color="#000000"
          text-color="#ffffff"
          width="100%"
          @click.prevent="handleLogin"
        />
      </div>

      <div class="login-page__form-group">
        <AppButton
          title="Log in with Google"
          type="button"
          color="#ffffff"
          text-color="#000000"
          border-color="#ccc"
          :icon="googleIcon"
          width="100%"
          @click.prevent="handleLogin"
        />
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
import googleIcon from '@/assets/icons/googleIcon.png'

const router = useRouter()
const loginStore = useLoginStore()
const toastStore = useToastStore()
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  loginStore.email = email.value
  loginStore.password = password.value
  const success = await loginStore.login()
  loading.value = false

  if (success) {
    toastStore.show('Success', 'Login successful! Redirecting...', ToastType.Success)
    router.push({ name: 'home' })
  } else {
    toastStore.show('Error', 'Login failed. Please check your credentials.', ToastType.Error)
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
</script>

<style scoped lang="scss">
h1 {
  color: black;
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
  background-color: white;

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
}
</style>
