import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: undefined,
		experimental: {
			remoteFunctions: true
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

if (process.env.VERCEL) {
	const vercel = (await import('@sveltejs/adapter-vercel')).default;
	config.kit.adapter = vercel({ runtime: 'nodejs22.x' });
} else {
	const node = (await import('@sveltejs/adapter-node')).default;
	config.kit.adapter = node();
}

export default config;
