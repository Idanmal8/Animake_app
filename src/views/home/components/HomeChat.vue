<template>
  <div class="home-chat">
    <div class="home-chat__messages">
      <template v-if="chatStore.messages.length === 0">
        <div class="home-chat__empty">
          <div class="home-chat__empty-icon" />
          <h3 class="home-chat__empty-title">Start a conversation</h3>
          <p class="home-chat__empty-description">
            Type a message below to begin chatting with Magnolia.
          </p>
        </div>
      </template>
      <template v-else>
        <div class="home-chat__list">
          <Message v-for="message in chatStore.messages" :key="message.id" :from="message.role">
            <MessageAvatar
              :src="message.role === 'user' ? '' : ''"
              :name="message.role === 'user' ? 'User' : 'Assistant'"
            />
            <div v-if="message.image" class="mt-2">
              <img
                :src="message.image"
                alt="Generated Image"
                class="rounded-lg max-w-full h-auto border border-border"
              />
            </div>
            <MessageContent v-else :content="message.content" />
          </Message>
        </div>
      </template>
    </div>

    <div class="home-chat__input-container">
      <form @submit.prevent="chatStore.handleSubmit" class="home-chat__form">
        <input
          v-model="chatStore.input"
          placeholder="Type your message..."
          class="home-chat__input"
          :disabled="chatStore.isLoading"
        />
        <AppButton
          title="Send"
          type="submit"
          class="home-chat__submit"
          :loading="chatStore.isLoading"
          :disabled="!chatStore.input.trim() || chatStore.isLoading"
          color="hsl(var(--primary))"
          text-color="hsl(var(--primary-foreground))"
          min-width="auto"
        >
          <template #trailing>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </template>
        </AppButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat/chat'
import { Message, MessageContent, MessageAvatar } from '@/components/ai-elements/message'
import AppButton from '@/components/buttons/AppButton.vue'

const chatStore = useChatStore()
</script>

<style lang="scss" scoped>
.home-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px; /* Align with app bar max-width if desired, or 100% */
  margin: 0 auto;
  position: relative;
  padding-top: 80px; /* Space for fixed app bar */
  padding-bottom: 2rem;

  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 5rem; /* Space for input area */
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: hsl(var(--muted-foreground));
    margin-top: 10vh;

    &-icon {
      width: 3rem;
      height: 3rem;
      background-color: hsl(var(--muted));
      border-radius: 50%;
      margin-bottom: 1rem;
    }

    &-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: hsl(var(--foreground));
      margin-bottom: 0.5rem;
    }
  }

  &__input-container {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 900px;
    z-index: 50;
  }

  &__form {
    display: flex;
    gap: 0.5rem;
    background-color: hsl(var(--card));
    padding: 0.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px var(--shadow-color);
    border: 1px solid hsl(var(--border));
    align-items: center;
  }

  &__input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    color: hsl(var(--foreground));
    outline: none;

    &::placeholder {
      color: hsl(var(--muted-foreground));
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__submit {
    /* Override AppButton styles if needed for compact fit */
    height: 40px;
    padding: 0 1rem;
  }
}
</style>
