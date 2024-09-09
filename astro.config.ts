// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // Enable the React integration
  integrations: [react(), tailwind()],
  // Use the Node.js adapter for SSR
  output: 'server',
  adapter: node({
    mode: 'standalone', // or 'middleware' depending on your deployment needs
  }),
  // Other configurations can go here
});
