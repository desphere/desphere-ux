import adapter from '@sveltejs/adapter-vercel';
// import adapter from '@sveltejs/adapter-cloudflare-workers';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		// adapter: adapter({
		// 	out: 'build',
		// 	precompress: false
		// })
		adapter: adapter()
	}
}; 

export default config;
