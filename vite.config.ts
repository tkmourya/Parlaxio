import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        manifest: {
          name: 'Parlaxio',
          short_name: 'Parlaxio',
          description: 'Premium Movie & Series Streaming',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: '/logo_px.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any maskable'
            },
            {
              src: '/logo_px.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
