import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/v1/admin': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
})

