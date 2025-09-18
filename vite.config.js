import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/codespaces-react/', 
  build: { outDir: 'docs' },     // 👈 nombre exacto de tu repositorio
  server: {
    proxy: {
      '/predict': {
        target: 'http://127.0.0.1:5000', // o tu URL forwarded en Codespaces
        changeOrigin: true,
      },
    },
  },
})
