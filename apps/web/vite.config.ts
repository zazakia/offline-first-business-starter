import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'robots.txt'],
      manifest: {
        name: 'Offline First Business App',
        short_name: 'OfflineBiz',
        description: 'Enterprise offline-first business application starter kit',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@repo/core': path.resolve(__dirname, '../../packages/core/src'),
      '@repo/db-dexie': path.resolve(__dirname, '../../packages/db-adapter-dexie/src'),
      '@repo/ui-core': path.resolve(__dirname, '../../packages/ui-core/src'),
      '@repo/entity-customer': path.resolve(__dirname, '../../packages/entity-customer/src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@tanstack/react-router', '@tanstack/react-query'],
          ui: ['lucide-react', 'react-hook-form', '@hookform/resolvers'],
          core: ['@repo/core', '@repo/db-dexie', '@repo/entity-customer'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
