import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		// Dev only: allow tunnel hosts (cloudflared/ngrok) so external webhooks reach vite.
		allowedHosts: true
	},
	optimizeDeps: {
		exclude: ['@node-rs/argon2']
	}
});
