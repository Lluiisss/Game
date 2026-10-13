import { defineConfig } from 'vite';

// GitHub Pages hostet das Spiel unter https://<user>.github.io/Game/
export default defineConfig({
  base: '/Game/',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
