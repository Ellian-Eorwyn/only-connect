import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { exec } from 'node:child_process';

// Dev-server only: lets the in-app "Update from GitHub" button pull the latest
// code + reinstall deps. Runs fixed commands on localhost for personal use;
// it does not exist in the production/single-file build.
function selfUpdatePlugin(): Plugin {
  return {
    name: 'oc-self-update',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__update', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('POST only');
          return;
        }
        exec(
          'git pull --ff-only && npm install --no-audit --no-fund',
          { cwd: process.cwd(), timeout: 180_000 },
          (err, stdout, stderr) => {
            const output = `${stdout || ''}${stderr || ''}`.trim();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: !err, output }));
          }
        );
      });
    },
  };
}

// Two build targets share this config:
//  - `npm run dev`   : normal Vite dev server (+ the self-update endpoint).
//  - `npm run build` : viteSingleFile inlines everything into one dist/index.html
//                      that can be double-clicked (file://) with no server.
export default defineConfig({
  plugins: [react(), viteSingleFile(), selfUpdatePlugin()],
  build: {
    target: 'es2020',
    // Inline every asset so the single-file build is truly self-contained.
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000_000,
  },
});
