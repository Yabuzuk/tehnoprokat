import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa' // Отключен для мобильного приложения
import path from 'path'

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  },
  plugins: [
    react()
    // PWA отключен для мобильного приложения
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