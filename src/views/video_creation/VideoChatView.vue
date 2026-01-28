<template>
  <div class="video-chat">
    <div class="video-chat__header">
        <h2 class="text-xl font-bold">Video Generation</h2>
        <div v-if="videoStore.selectedImage" class="video-chat__context">
            <span class="text-sm font-medium mb-1 block">Context Image:</span>
            <img :src="videoStore.selectedImage" class="h-20 w-auto rounded-lg border border-border" />
        </div>
    </div>

    <div class="video-chat__messages">
      <template v-if="videoStore.messages.length === 0">
        <div class="video-chat__empty">
            <h3 class="video-chat__empty-title">Animate your image</h3>
            <p class="video-chat__empty-description">
                Describe how you want to animate the context image (e.g., "Make the character wave").
            </p>
        </div>
      </template>
      <template v-else>
        <div class="video-chat__list">
          <Message v-for="message in videoStore.messages" :key="message.id" :from="message.role">
            <MessageAvatar
              :src="message.role === 'user' ? personIcon : magnoliaLogo"
              :name="message.role === 'user' ? 'User' : 'Magnolia'"
            />
            
            <div v-if="message.video" class="mt-2">
               <video 
                controls 
                autoplay 
                loop 
                class="rounded-lg max-w-sm w-full h-auto border border-border" 
                :src="message.video"
               >
                 Your browser does not support the video tag.
               </video>
            </div>
            <div v-else-if="message.role === 'user'" class="home-chat__bubble">
              {{ message.content }}
            </div>
            <!-- Fallback text content for assistant errors -->
            <div v-else class="text-foreground">
                 {{ message.content }}
            </div>
          </Message>
        </div>
      </template>
       <div v-if="videoStore.isLoading" class="p-4 flex justify-center">
            <div class="animate-pulse text-muted-foreground">Generating video... (this may take up to a minute)</div>
       </div>
    </div>

    <div class="video-chat__input-container">
      <form @submit.prevent="videoStore.handleSubmit" class="video-chat__form">
        <input
          v-model="videoStore.input"
          placeholder="Describe the animation..."
          class="video-chat__input"
          :disabled="videoStore.isLoading"
        />
        <AppButton
          title="Generate"
          type="submit"
          class="video-chat__submit"
          :loading="videoStore.isLoading"
          :disabled="!videoStore.input.trim() || videoStore.isLoading"
          color="hsl(var(--primary))"
          text-color="hsl(var(--primary-foreground))"
          min-width="auto"
        >
          <template #trailing>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </template>
        </AppButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVideoStore } from '@/stores/video/video'
import { Message, MessageAvatar } from '@/components/ai-elements/message'
import AppButton from '@/components/buttons/AppButton.vue'
import personIcon from '@/assets/icons/person.png'
import magnoliaLogo from '@/assets/logo-no-bg.png'

const videoStore = useVideoStore()
</script>

<style lang="scss" scoped>
/* Reuse Message styles from HomeChat via BEM or similar structure. 
   Ideally these should be shared, but for speed copying structure. */
.home-chat__bubble {
    @apply bg-primary text-primary-foreground px-4 py-3 rounded-lg text-sm max-w-full break-words;
}

.video-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  padding-top: 80px;
  padding-bottom: 2rem;

  &__header {
      padding: 0 1rem;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

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
    padding-bottom: 5rem;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: hsl(var(--muted-foreground));
    margin-top: 5vh;
    
    &-title {
        font-size: 1.25rem;
        font-weight: 600;
         color: hsl(var(--foreground));
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
