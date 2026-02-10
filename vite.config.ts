import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  const useLocalApi = env.VITE_USE_LOCAL_API === 'false'
  const target = useLocalApi ? 'http://localhost:3000' : 'https://animake-backend.onrender.com'

  console.log(`[Vite] Proxying /api to: ${target}`)

  return {
    base: '/Animake_app/',
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'dotlottie-player',
          },
        },
      }),
      vueDevTools(),
    ],
    assetsInclude: ['**/*.lottie'],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    envDir: './src',
    // vite.config.js
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          // Change the rewrite to ensure it only strips the leading /api
          rewrite: (path) => path.replace(/^\/api/, ''),
          // Add this to see exactly what Vite is doing in your terminal
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`[Proxy] Forwarding: ${req.method} ${req.url} -> ${proxyReq.path}`)
            })
          },
        },
      },
    },
  }
})
