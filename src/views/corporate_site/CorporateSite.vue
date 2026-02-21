<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import gsap from 'gsap'
import AppButton from '@/components/buttons/AppButton.vue'
import ThemeToggle from '@/components/buttons/ThemeToggle.vue'
import { authService } from '@/api/services/auth'

const router = useRouter()

const isAuthenticated = computed(() => !!localStorage.getItem('token'))

const handleTryIt = async () => {
    if (isAuthenticated.value) {
        try {
            const response = await authService.refresh()
            localStorage.setItem('token', response.access_token)
            localStorage.setItem('user', JSON.stringify(response.user))
            router.push({ name: 'home' })
        } catch (error) {
            // The 401 interceptor in httpClient might already redirect,
            // but we add this as a fallback safety.
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            router.push({ name: 'login' })
        }
    } else {
        router.push({ name: 'login' })
    }
}

// ... existing refs and onMounted ...
const heroTitle = ref<HTMLElement | null>(null)
const heroText = ref<HTMLElement | null>(null)
const heroCta = ref<HTMLElement | null>(null)
const heroVideo = ref<HTMLElement | null>(null)

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
    .from(heroVideo.value, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.4')
})
</script>

<template>
    <div class="corporate-site">
        <header class="corporate-site__header">
            <div class="corporate-site__logo">Animake</div>
            <nav class="corporate-site__nav">
                 <ThemeToggle />
                 <AppButton 
                    v-if="!isAuthenticated"
                    title="Sign In" 
                    variant="ghost" 
                    @click="handleTryIt"
                 />
                 <AppButton 
                    :title="isAuthenticated ? 'Go to Animator' : 'Try It Free'" 
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
                    <div class="video-container" ref="heroVideo">
                        <!-- Placeholder video until user provides one -->
                        <video 
                            autoplay 
                            loop 
                            muted 
                            playsinline 
                            class="hero-video"
                            poster="https://placehold.co/600x400/1a1a1a/ffffff?text=Video+Placeholder"
                        >
                            <!-- <source src="@/assets/your-video.mp4" type="video/mp4"> -->
                            Your browser does not support the video tag.
                        </video>
                        <div class="video-overlay"></div>
                    </div>
                </div>
            </section>
        </main>
        
        <footer class="corporate-site__footer">
            <p>&copy; 2026 Animake. All rights reserved.</p>
            <div class="corporate-site__terms">
                <RouterLink to="/terms">Terms and Conditions</RouterLink>
            </div>
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

    .video-container {
        width: 100%;
        max-width: 800px;
        aspect-ratio: 16/9;
        border-radius: 16px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        border: 1px solid hsl(var(--border));
        background-color: hsl(var(--card));
    }

    .hero-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .video-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent 80%, rgba(0,0,0,0.2));
        pointer-events: none;
    }

    &__footer {
        padding: 2rem;
        text-align: center;
        color: hsl(var(--muted-foreground));
        font-size: 0.875rem;

        .corporate-site__terms {
            margin-top: 0.5rem;
            a {
                color: inherit;
                text-decoration: none;
                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }
}
</style>