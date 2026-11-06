import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// `vite build --mode app` makes the Android app build: no demo data, no service worker (files ship inside the APK).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    VitePWA({
      disable: mode === 'app',
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Brilla — Learn & Play',
        short_name: 'Brilla',
        description: 'Colourful lessons for kids aged 2–12: tracing, colouring, drawing, phonics, maths, science and English',
        theme_color: '#7c3aed',
        background_color: '#fff7ed',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Every lesson ships inside the bundle, so caching the build makes the whole app work offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        // Teacher voice clips are fetched when first needed, then kept for offline use.
        runtimeCaching: [
          { urlPattern: /\/voice\/manifest\.json$/, handler: 'NetworkFirst', options: { cacheName: 'brilla-voice-list' } },
          { urlPattern: /\/voice\/.+\.mp3$/, handler: 'CacheFirst', options: { cacheName: 'brilla-voices', expiration: { maxEntries: 12000 }, cacheableResponse: { statuses: [0, 200] } } },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
  },
}));
