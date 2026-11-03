import { defineConfig } from 'vite';
import path from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        animationReview: path.resolve(__dirname, 'animation-review.html'),
        pixelArena: path.resolve(__dirname, 'pixel-arena.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@magicforge/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    allowedHosts: true,
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            const code = (err as any).code;
            if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'EPIPE') {
              return;
            }
            console.warn('[vite-ws-proxy-warning]', err.message);
          });
        },
      },
      '/health': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
