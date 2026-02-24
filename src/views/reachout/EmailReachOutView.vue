<template>
  <div class="reachout-page">
    <div class="reachout-page__container">
      <h1>Reach Out & Feedback</h1>
      <p class="reachout-page__description">
        We'd love to hear your thoughts, feedback, or any issues you've encountered. Let us know below!
      </p>
      
      <form @submit.prevent="handleSubmit" class="reachout-page__form">
        <div class="reachout-page__form-group">
          <InputField
            label="Name"
            v-model="name"
            type="text"
            placeholder="Your Name"
            :rules="nameRules"
            dark
          />
        </div>

        <div class="reachout-page__form-group">
          <InputField
            label="Email"
            v-model="email"
            type="email"
            placeholder="Your Email"
            :rules="emailRules"
            dark
          />
        </div>

        <div class="reachout-page__form-group">
           <label class="reachout-page__label">Message</label>
           <textarea
             v-model="message"
             class="reachout-page__textarea"
             placeholder="How can we help?"
             rows="5"
             required
           ></textarea>
        </div>

        <div class="reachout-page__form-group reachout-page__submit">
          <AppButton
            title="Send Message"
            type="submit"
            :loading="feedbackStore.isSending"
            color="#ffffff"
            text-color="#000000"
            width="100%"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast/toast'
import InputField from '@/components/fields/InputField.vue'
import AppButton from '@/components/buttons/AppButton.vue'
import { ToastType } from '@/components/toasts/enums'
import { useFeedbackStore } from '@/stores/feedback/feedback'

const router = useRouter()
const toastStore = useToastStore()
const feedbackStore = useFeedbackStore()

const name = ref('')
const email = ref('')
const message = ref('')

const nameRules = [
  (v: string) => !!v || 'Name is required'
]

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
]

const handleSubmit = async () => {
    if(!name.value || !email.value || !message.value) {
       toastStore.show('Error', 'Please fill in all fields', ToastType.Error)
       return
    }

    const success = await feedbackStore.sendFeedback(name.value, email.value, message.value)

    if (success) {
        // Clear form
        name.value = ''
        email.value = ''
        message.value = ''
        router.push({ name: 'home' })
    }
}
</script>

<style scoped lang="scss">
.reachout-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  padding: 2rem;
  box-sizing: border-box;
  background-color: #000000;
  color: #ffffff;
  background-image: radial-gradient(circle at 50% 0, rgba(255,255,255,0.05) 0%, transparent 60%);

  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 500px;
    background: rgba(255, 255, 255, 0.05);
    padding: 3rem;
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    h1 {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align: center;
    }
  }

  &__description {
      text-align: center;
      color: #999;
      font-size: 1rem;
      line-height: 1.5;
      margin-bottom: 2.5rem;
  }

  &__form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__form-group {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  &__label {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      color: #cccccc;
      font-weight: 500;
  }

  &__textarea {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 1rem;
      color: white;
      font-family: inherit;
      resize: vertical;
      box-sizing: border-box;
      transition: all 0.2s ease;

      &:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(0, 0, 0, 0.5);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
      }
      
      &::placeholder {
          color: rgba(255, 255, 255, 0.3);
      }
  }

  &__submit {
      margin-top: 1rem;
  }
}

// Ensure responsiveness
@media (max-width: 600px) {
    .reachout-page {
        padding: 1rem;
        
        &__container {
            padding: 2rem 1.5rem;
        }

        h1 {
            font-size: 1.8rem;
        }
    }
}
</style>
