import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        configure: (proxy) => {
          // Log what Vite forwards so we can verify headers reach the target
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[proxy →]', req.method, req.url,
              '| x-api-key:', proxyReq.getHeader('x-api-key')
                ? String(proxyReq.getHeader('x-api-key')).slice(0, 8) + '…'
                : '(missing!)',
              '| anthropic-version:', proxyReq.getHeader('anthropic-version') ?? '(missing!)',
            )
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[proxy ←]', proxyRes.statusCode, req.url)
          })
        },
      },
    },
  },
})
