<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/buttons/AppButton.vue'
import SpriteSheetPlayer from '@/components/display/SpriteSheetPlayer.vue'
import frogSprite from '@/assets/sprites/frog_sprite.png'
import dogSprite from '@/assets/sprites/dog_sprite.png'
import manWalkingSprite from '@/assets/sprites/man_walking.png'
import manRunningSprite from '@/assets/sprites/sprite_sheet_11x8_740x1013.png'

const router = useRouter()

const handleTryIt = () => {
    router.push({ name: 'login' })
}

interface SpriteAnimation {
    id: number
    src: string
    frameWidth: number
    frameHeight: number
    totalFrames: number
    cols: number
    rows: number
    fps: number
}

const animations: SpriteAnimation[] = [
    {
        id: 1,
        src: dogSprite,
        frameWidth: 1024,
        frameHeight: 1024,
        totalFrames: 62,
        cols: 8,
        rows: 8,
        fps: 24
    },
    {
        id: 2,
        src: frogSprite,
        frameWidth: 1024,
        frameHeight: 1024,
        totalFrames: 59,
        cols: 8,
        rows: 8,
        fps: 24
    },
    {
        id: 3,
        src: manRunningSprite,
        frameWidth: 740,
        frameHeight: 1013,
        totalFrames: 81,
        cols: 11,
        rows: 8,
        fps: 32
    },
    {
        id: 4,
        src: frogSprite,
        frameWidth: 1024,
        frameHeight: 1024,
        totalFrames: 59,
        cols: 8,
        rows: 8,
        fps: 24
    },
    {
        id: 5,
        src: dogSprite,
        frameWidth: 1024,
        frameHeight: 1024,
        totalFrames: 62,
        cols: 8,
        rows: 8,
        fps: 24
    },
]
</script>

<template>
    <div class="corporate-site">
        <header class="corporate-site__header">
            <div class="corporate-site__logo">Animake</div>
            <nav class="corporate-site__nav">
                 <AppButton 
                    title="Sign In" 
                    variant="ghost" 
                    @click="handleTryIt"
                 />
                 <AppButton 
                    title="Try It Free" 
                    @click="handleTryIt"
                 />
            </nav>
        </header>

        <main class="corporate-site__main">
            <section class="corporate-site__hero">
                <div class="corporate-site__hero-content">
                    <h1>Turn Videos into Custom Animations</h1>
                    <p>The easiest way to convert your videos into lightweight, scalable Custom animations for your web and mobile apps.</p>
                    <div class="corporate-site__cta">
                        <AppButton 
                            title="Start Creating" 
                            color="hsl(var(--primary))" 
                            text-color="hsl(var(--primary-foreground))"
                            width="200px"
                            @click="handleTryIt"
                        />
                    </div>
                </div>

                <div class="corporate-site__hero-visual">
                    <div class="sprites-grid">
                        <div v-for="anim in animations" :key="anim.id" class="sprite-card">
                            <SpriteSheetPlayer 
                                :src="anim.src"
                                :frame-width="anim.frameWidth"
                                :frame-height="anim.frameHeight"
                                :total-frames="anim.totalFrames"
                                :cols="anim.cols"
                                :rows="anim.rows"
                                :fps="anim.fps"
                                :playing="true"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </main>
        
        <footer class="corporate-site__footer">
            <p>&copy; 2026 Animake. All rights reserved.</p>
        </footer>
    </div>
</template>

<style lang="scss" scoped>
.corporate-site {
    min-height: 100vh;
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    display: flex;
    flex-direction: column;

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 2rem;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    &__logo {
        font-family: 'azlando_sans_semiExpanded', sans-serif;
        font-weight: bold;
        font-size: 1.5rem;
    }

    &__nav {
        display: flex;
        gap: 1rem;
    }

    &__main {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        width: 100%;
    }

    &__hero {
         display: flex;
         flex-direction: column;
         align-items: center;
         gap: 3rem;
         max-width: 1200px;
         width: 100%;
         
         @media (min-width: 900px) {
             flex-direction: row;
             justify-content: space-between;
             align-items: center;
             text-align: left;
         }
    }

    &__hero-content {
        flex: 1;
        max-width: 600px;
        text-align: center;

        @media (min-width: 900px) {
            text-align: left;
        }

        h1 {
             font-size: 3rem;
             font-weight: 800;
             margin-bottom: 1.5rem;
             line-height: 1.1;
             background: linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)));
             -webkit-background-clip: text;
             background-clip: text;
             -webkit-text-fill-color: transparent;
             
             @media (min-width: 1200px) {
                 font-size: 4rem;
             }
        }

        p {
             font-size: 1.25rem;
             color: hsl(var(--muted-foreground));
             margin-bottom: 2.5rem;
             line-height: 1.6;
        }
    }
    
    &__hero-visual {
        flex: 1;
        display: flex;
        justify-content: center;
        width: 100%;
        // max-width: 500px; // Let it expand for the grid
    }

    .sprites-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1.5rem;
        width: 100%;
        max-width: 800px;
    }

    .sprite-card {
        aspect-ratio: 1;
        border-radius: 16px;
        background: hsl(var(--card));
        border: 1px solid hsl(var(--border));
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
    }

    &__footer {
        padding: 2rem;
        text-align: center;
        color: hsl(var(--muted-foreground));
        font-size: 0.875rem;
    }
}
</style>