import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: resolve(__dirname, 'tsconfig.app.json')
    })
  ],
  build: {
    outDir: 'dist',
  },
  // GitHub Pages usually serves from a subdirectory (the repo name), 
  // so relative base path is safer.
  base: './' 
});
