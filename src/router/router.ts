import { createRouter, createWebHistory } from 'vue-router'
import * as routes from '../router/index.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: routes.LoginView,
    },
    {
      path: '/home',
      name: 'home',
      component: routes.HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/video-generation',
      name: 'video-generation',
      component: routes.VideoChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/lottie-preview',
      name: 'lottie-preview',
      component: routes.LottiePreview,
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'login' })
  } else if (to.name === 'login' && token) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
