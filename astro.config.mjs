import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  site: 'https://asymptopiasoftware.github.io',
  output: 'static',
  integrations: [vue()],
});
