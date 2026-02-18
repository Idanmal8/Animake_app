<script setup lang="ts">
import { Sparkles, Video, Upload, Download, Gamepad2, Lightbulb } from 'lucide-vue-next'

const steps = [
  {
    icon: Sparkles,
    title: 'Generate Sprite Artwork',
    description: 'Generate your Sprite Artwork with Gemini/Sora/OpenArt (or similar).',
    tip: 'TIP: generate with a SOLID color background like a green screen.',
  },
  {
    icon: Video,
    title: 'Animate with AI',
    description: 'Animate your art with Veo, Kling, WAN, or Grok.',
  },
  {
    icon: Upload,
    title: 'Upload to Animake',
    description: 'Upload your video here and Animake will guide you the rest of the way!',
  },
  {
    icon: Download,
    title: 'Download Sprite Sheet',
    description: 'Download your animation-ready sprite sheet or individual image zip file.',
  },
  {
    icon: Gamepad2,
    title: 'Ready to Animate',
    description: 'Your animated sprite is now animation-ready.',
  },
]
</script>

<template>
  <div class="steps-guide">
    <h2 class="steps-guide__header">Create Animated Spritesheets & Make Animation-Ready Icons</h2>
    
    <div class="steps-guide__list">
      <div v-for="(step, index) in steps" :key="index" class="step">
        <div class="step__number">{{ index + 1 }}</div>
        <div class="step__content">
          <div class="step__header">
            <component :is="step.icon" class="step__icon" />
            <h3 class="step__title">{{ step.title }}</h3>
          </div>
          <p class="step__description">
            {{ step.description }}
            <span v-if="step.tip" class="step__tip-inline">{{ step.tip }}</span>
          </p>
        </div>
      </div>
    </div>

    <div class="steps-guide__footer-tip">
      <Lightbulb class="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
      <p>
        <strong>TIP:</strong> You can also upload still images or a batch of images (such as game icons) to automatically align and position them with perfect consistency.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.steps-guide {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 0;
  font-family: 'Zalando_Sans', sans-serif;

  &__header {
    font-family: 'azlando_sans_semiExpanded', sans-serif;
    font-size: 1.5rem;
    font-weight: bold;
    color: hsl(var(--foreground));
    margin-bottom: 2rem;
    text-align: center;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__footer-tip {
    margin-top: 3rem;
    padding: 1rem;
    background-color: hsl(var(--muted)); /* Subtle background */
    border-left: 4px solid #eab308; /* Yellow tip accents */
    border-radius: 4px;
    display: flex;
    align-items: flex-start;
    color: hsl(var(--muted-foreground));
    font-size: 0.95rem;

    strong {
      color: hsl(var(--foreground));
    }
  }
}

.step {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;

  &__number {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-family: 'azlando_sans_semiExpanded', sans-serif;
  }

  &__content {
    flex: 1;
    padding-top: 0.125rem; /* Align visual baseline with number/icon */
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  &__icon {
    width: 1.25rem;
    height: 1.25rem;
    color: hsl(var(--primary));
  }

  &__title {
    font-weight: 600;
    font-size: 1.125rem;
    color: hsl(var(--foreground));
  }

  &__description {
    color: hsl(var(--muted-foreground));
    line-height: 1.5;
  }

  &__tip-inline {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    font-style: italic;
    opacity: 0.8;
  }
}
</style>
