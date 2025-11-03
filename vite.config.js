import createSvgSpritePlugin from 'vite-plugin-svg-sprite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), createSvgSpritePlugin({
    exportType: 'vanilla',
    include: '**/sprites/*.svg'
  })]
});
