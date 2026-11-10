import { defineConfig } from 'astro/config';

// Site statique multi-pages. Chaque page devient /nom/index.html.
export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
});
