import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.svx'],
      layout: { runbook: resolve(here, 'src/lib/layouts/runbook.svelte') },
    }),
  ],
  kit: {
    adapter: adapter({ fallback: undefined, strict: true }),
    alias: { '#lib': 'src/lib' },
    prerender: { handleHttpError: 'warn' },
  },
};
