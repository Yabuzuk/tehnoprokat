import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/tehnoprokat/' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Водовозка - Доставка воды и откачка септика',
        short_name: 'Водовозка',
        description: 'Заказ услуг доставки воды и откачки септика',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'fullscreen',
        start_url: '/tehnoprokat/',
        scope: '/tehnoprokat/',
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        orientation: 'portrait',
        icons: [
          {
            src: 'water.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['utilities', 'business'],
        shortcuts: [
          {
            name: 'Заказать воду',
            short_name: 'Вода',
            description: 'Быстрый заказ доставки воды',
            url: '/tehnoprokat/user/order/water_delivery',
            icons: [{ src: 'water.png', sizes: '96x96' }]
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    global: 'globalThis'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})