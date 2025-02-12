import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: '0.0.0.0' // Important for deployment
  },
  preview: {
    allowedHosts: [
      'fetch-0ql69.kinsta.app'
    ],
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: '0.0.0.0' // Important for deployment
  }
})