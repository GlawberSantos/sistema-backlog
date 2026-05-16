import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-nojekyll',
      apply: 'build',
      enforce: 'post',
      generateBundle() {
        const nojekyllPath = path.resolve(__dirname, '.nojekyll')
        const distPath = path.resolve(__dirname, 'dist', '.nojekyll')
        const configYmlPath = path.resolve(__dirname, '_config.yml')
        const distConfigPath = path.resolve(__dirname, 'dist', '_config.yml')
        
        if (fs.existsSync(nojekyllPath)) {
          fs.copyFileSync(nojekyllPath, distPath)
        }
        if (fs.existsSync(configYmlPath)) {
          fs.copyFileSync(configYmlPath, distConfigPath)
        }
      }
    }
  ],

  // IMPORTANTE PARA GITHUB PAGES
  base: '/sistema-backlog/',

  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },

  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, ''),
        changeOrigin: true,
      },
    },
  },
})