import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three')) return 'three'
          if (id.includes('react-dom')) return 'react-dom'
          if (id.includes('react-router')) return 'react-router'
          if (id.includes('firebase')) return 'firebase'
        }
      }
    }
  }
})