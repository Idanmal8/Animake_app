<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import AppButton from '@/components/buttons/AppButton.vue'
import ThemeToggle from '@/components/buttons/ThemeToggle.vue'
import SpriteSheetPlayer from '@/components/display/SpriteSheetPlayer.vue'
import dogSprite from '@/assets/sprites/dog_sprite.png'
import ghostSprite from '@/assets/sprites/ghost1.png'

const router = useRouter()

const heroTitle = ref<HTMLElement | null>(null)
const heroText = ref<HTMLElement | null>(null)
const heroCta = ref<HTMLElement | null>(null)
const spriteCards = ref<HTMLElement[]>([])
const areSpritesPlaying = ref<boolean[]>(new Array(1).fill(false)) // Track playing state per card

onMounted(() => {
    const tl = gsap.timeline()
    
    tl.from(heroTitle.value, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    })
    .from(heroText.value, {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    }, '-=0.6')
    .from(heroCta.value, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.6')
    .from(spriteCards.value, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
    }, '-=0.4')

    // Start playing sprites only after the heavy entrance animation is mostly done
    // to prevent main-thread fighting (GSAP vs Paint).
    tl.to({}, {
        duration: 0.1,
        onComplete: () => {
            // Trigger all sprites to start playing
            areSpritesPlaying.value = areSpritesPlaying.value.map(() => true)
        }
    }, '-=0.5') // Start slightly before the very end of staggered entrance
})

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
        src: ghostSprite,
        frameWidth: 1024,
        frameHeight: 1024,
        totalFrames: 70,
        cols: 16,
        rows: 5,
        fps: 24
    },
]
</script>

<template>
    <div class="corporate-site">
        <header class="corporate-site__header">
            <div class="corporate-site__logo">Animake</div>
            <nav class="corporate-site__nav">
                 <ThemeToggle />
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
                    <h1 ref="heroTitle">Turn Videos into Custom Animations</h1>
                    <p ref="heroText">The easiest way to convert your videos into lightweight, scalable Custom animations for your web and mobile apps.</p>
                    <div ref="heroCta" class="corporate-site__cta">
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
                        <div 
                            v-for="(anim, index) in animations" 
                            :key="anim.id" 
                            class="sprite-card"
                            ref="spriteCards"
                        >
                            <SpriteSheetPlayer 
                                :src="anim.src"
                                :frame-width="anim.frameWidth"
                                :frame-height="anim.frameHeight"
                                :total-frames="anim.totalFrames"
                                :cols="anim.cols"
                                :rows="anim.rows"
                                :fps="anim.fps"
                                :playing="areSpritesPlaying[index]"
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
        will-change: transform, opacity;
        transform: translateZ(0); /* Force GPU layer */
        backface-visibility: hidden;

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