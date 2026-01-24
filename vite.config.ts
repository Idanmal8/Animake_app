import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'dotlottie-player'
        }
      }
    }),
    vueDevTools(),
  ],
  assetsInclude: ['**/*.lottie'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // vite.config.js
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        // Change the rewrite to ensure it only strips the leading /api
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Add this to see exactly what Vite is doing in your terminal
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[Proxy] Forwarding: ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
        }
      },
    },
  },
})
