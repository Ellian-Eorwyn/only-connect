import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Two build targets share this config:
//  - `npm run dev`   : normal Vite dev server.
//  - `npm run build` : viteSingleFile inlines everything into one dist/index.html
//                      that can be double-clicked (file://) with no server.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    // Inline every asset so the single-file build is truly self-contained.
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000_000,
  },
});
