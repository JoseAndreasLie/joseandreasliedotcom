import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': process.env.API_URL || 'http://localhost:4000',
      // Prod: Caddy maps /media/* to minio:9000/works/*
      '/media': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/media/, '/works'),
      },
    },
  },
})
