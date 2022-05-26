// production was hosted on Vercel. one of the easiest ways to host nodejs, svelte, and nextjs apps. 
import adapter from '@sveltejs/adapter-vercel';

// this just didnt work. do not attempt.
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
