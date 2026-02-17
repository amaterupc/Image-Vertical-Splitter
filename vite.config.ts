import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  build: {
    outDir: 'dist',
  },
  // GitHub Pages usually serves from a subdirectory (the repo name), 
  // so relative base path is safer.
  base: './' 
});