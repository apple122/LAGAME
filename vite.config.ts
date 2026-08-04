import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/steamspy': {
        target: 'https://steamspy.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/steamspy/, '')
      }
    }
  }
})
