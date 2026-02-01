<template>
  <div class="home-app-bar">
    <div class="home-app-bar__leading">
      <img :src="logo" alt="Magnolia Logo" class="home-app-bar__logo" />
      <span class="home-app-bar__title">Magnolia</span>
    </div>
    <div class="home-app-bar__actions">
      <div v-if="isSubscribed" class="home-app-bar__user-menu-wrapper" @click="isMenuOpen = !isMenuOpen">
          <div class="home-app-bar__user-icon">
            <User :size="24" />
          </div>
          
          <!-- Floating Menu -->
          <!-- Floating Menu -->
          <Transition name="menu">
            <div v-if="isMenuOpen" class="home-app-bar__menu">
                <button class="home-app-bar__menu-item" @click.stop="handleBillingClick">
                    <span class="home-app-bar__menu-icon">💰</span>
                    Billing
                </button>
                <button class="home-app-bar__menu-item home-app-bar__menu-item--danger" @click.stop="handleLogout">
                    <span class="home-app-bar__menu-icon">🚪</span>
                    Logout
                </button>
            </div>
          </Transition>
      </div>
      <AppButton
        v-else
        title="Purchase"
        type="button"
        color="hsl(var(--primary))"
        text-color="hsl(var(--primary-foreground))"
        min-width="200px"
        @click="emit('purchase')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppButton from '@/components/buttons/AppButton.vue'
import logo from '@/assets/logo-no-bg.png'
import { useLoginStore } from '@/stores/login/login'
import { storeToRefs } from 'pinia'
import { User } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const loginStore = useLoginStore()
const { isSubscribed } = storeToRefs(loginStore)
const isMenuOpen = ref(false)
const router = useRouter()

const emit = defineEmits<{
  (e: 'purchase'): void
  (e: 'open-billing'): void
}>()

const handleBillingClick = () => {
    isMenuOpen.value = false
    emit('open-billing')
}

const handleLogout = () => {
    isMenuOpen.value = false
    loginStore.logout()
    // Force a full reload to clear memory state and ensure clean login
    window.location.replace('/login')
}

// Simple click outside detection
const closeMenu = () => {
   if (isMenuOpen.value) isMenuOpen.value = false
}

// Using a transparent overlay or window click listener might be better, 
// but for simplicity in this component context, let's keep it scoped or rely on parent
// Actually, let's add a window listener for robustness if user clicks elsewhere
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (isMenuOpen.value && !target.closest('.home-app-bar__user-menu-wrapper')) {
        isMenuOpen.value = false
    }
}

onMounted(() => {
    window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.home-app-bar {
  width: 100%;
  max-width: 900px;
  height: 64px;
  background-color: hsl(var(--card));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem;
  margin-bottom: 2rem;

  /* Theme-aware shadow */
  box-shadow: 0 1px 10px var(--shadow-color);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;

  &__leading {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__logo {
    height: 32px;
    width: auto;
    object-fit: contain;
  }

  &__title {
    font-family: 'azlando_sans_semiExpanded', sans-serif;
    font-weight: bold;
    font-size: 1.5rem;
    color: hsl(var(--foreground));
    transition: color 0.3s ease;
  }

  &__actions {
    display: flex;
    align-self: center;
    justify-self: center;
    position: relative; // For menu positioning
  }

  &__user-menu-wrapper {
      position: relative;
      cursor: pointer;
  }

  &__user-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      border-radius: 9999px; // full
      background-color: hsl(var(--secondary));
      color: hsl(var(--secondary-foreground));
      transition: background-color 0.2s;

      &:hover {
          background-color: hsl(var(--muted)); 
      }
  }

  &__menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      min-width: 10rem;
      background-color: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 50;
      overflow: hidden;
  }

  &__menu-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 1rem;
      text-align: left;
      font-size: 0.875rem;
      color: hsl(var(--foreground));
      background: none;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
          background-color: hsl(var(--muted));
      }

      &--danger {
          color: hsl(var(--destructive));
          &:hover {
              background-color: hsl(var(--destructive) / 0.1);
          }
      }
  }

  &__menu-icon {
      font-size: 1.1rem;
  }

  /* Menu Transition */
  .menu-enter-active,
  .menu-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
    transform-origin: top right;
  }

  .menu-enter-from,
  .menu-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  @media (max-width: 1200px) {
    width: 60%;
    max-width: 100%;
  }

  @media (max-width: 650px) {
    justify-content: center;

    &__actions {
      display: none;
    }

    &__leading {
      /* Ensure logo/title logic centers properly if needed */
    }
  }
}
</style>
