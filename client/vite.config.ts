import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        animationReview: path.resolve(__dirname, 'animation-review.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@magicforge/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
