import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    // Proxy all API requests to backend during development
    // This ensures CORS doesn't block local testing
    // In production, built assets are served from the same origin as the backend
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // Allow WebSocket and SSE connections
        ws: true,
        // Passthrough SSE headers for event streaming
        proxyRes: (proxyRes) => {
          // Ensure SSE headers are passed through
          if (proxyRes.headers['content-type']?.includes('event-stream')) {
            proxyRes.headers['cache-control'] = 'no-cache';
            proxyRes.headers['connection'] = 'keep-alive';
            proxyRes.headers['x-accel-buffering'] = 'no';
          }
        },
        // Rewrite path as-is
        rewrite: (path) => path,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  // Configure environment variable loading
  envPrefix: 'VITE_',
})
