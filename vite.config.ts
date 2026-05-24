import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // GitHub Pages (subpasta do repositório)
  base: '/sistema-backlog/',

  server: {
    host: true,
    port: 5173,
  },
})
