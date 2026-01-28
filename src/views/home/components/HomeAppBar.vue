<template>
  <div class="home-app-bar">
    <div class="home-app-bar__leading">
      <img :src="logo" alt="Magnolia Logo" class="home-app-bar__logo" />
      <span class="home-app-bar__title">Magnolia</span>
    </div>
    <div class="home-app-bar__actions">
      <AppButton
        title="Purchase"
        type="button"
        color="hsl(var(--primary))"
        text-color="hsl(var(--primary-foreground))"
        min-width="200px"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/buttons/AppButton.vue'
import logo from '@/assets/logo-no-bg.png'
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
      /* Ensure logo/title logic centers properly if needed, 
         flex justify-center on parent handles general centering if only one child exists,
         but leading is that child. */
    }
  }
}
</style>
