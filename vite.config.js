import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:5005',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true
      }
    }
  }
})
