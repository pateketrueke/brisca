import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
		adapter: adapter({
		  strict: false,
			bundle: 'inline',
		  fallback: 'index.html',
			pages: 'dist/www',
		}),
    router: {
      type: 'hash',
    },
	},
};

export default config;
