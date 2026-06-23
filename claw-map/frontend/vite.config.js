import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',      // Google OAuth 시작 경로
      '/login/oauth2': 'http://localhost:8080', // Google OAuth 콜백 경로
    },
  },
})
