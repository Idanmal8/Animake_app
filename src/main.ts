import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/router'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

import { useThemeStore } from '@/stores/theme/theme'
const themeStore = useThemeStore()
themeStore.initTheme()

app.mount('#app')
