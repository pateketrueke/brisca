import createSvgSpritePlugin from 'vite-plugin-svg-sprite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'import.meta.env.GIT_REVISION': JSON.stringify(process.env.GIT_REVISION || 'HEAD'),
  },
  plugins: [
    sveltekit(),
    createSvgSpritePlugin({
      exportType: 'vanilla',
      include: '**/sprites/*.svg'
    }),
  ]
});
