// Build script: bundles the extension into ./dist with esbuild and copies static files.
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dist = path.join(root, 'dist');
const watch = process.argv.includes('--watch');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(path.join(root, 'static'), dist, { recursive: true });

/** @type {import('esbuild').BuildOptions} */
const common = {
  bundle: true,
  minify: false,
  sourcemap: false,
  target: ['chrome120'],
  platform: 'browser',
  logLevel: 'info',
  loader: { '.css': 'text' },
  define: { 'process.env.NODE_ENV': '"production"' },
};

const builds = [
  // Service worker (manifest "type": "module")
  { entryPoints: [path.join(root, 'src/background/index.ts')], outfile: path.join(dist, 'background.js'), format: 'esm' },
  // Content script (isolated world)
  { entryPoints: [path.join(root, 'src/content/index.ts')], outfile: path.join(dist, 'content.js'), format: 'iife' },
  // Content script (MAIN world: reads YouTube's page globals)
  { entryPoints: [path.join(root, 'src/content/main.ts')], outfile: path.join(dist, 'content-main.js'), format: 'iife' },
  // Extension pages
  { entryPoints: [path.join(root, 'src/sidepanel/index.ts')], outfile: path.join(dist, 'sidepanel.js'), format: 'iife' },
  { entryPoints: [path.join(root, 'src/options/index.ts')], outfile: path.join(dist, 'options.js'), format: 'iife' },
];

if (watch) {
  const contexts = await Promise.all(builds.map((b) => esbuild.context({ ...common, ...b })));
  await Promise.all(contexts.map((c) => c.watch()));
  console.log('watching…');
} else {
  await Promise.all(builds.map((b) => esbuild.build({ ...common, ...b })));
  if (!existsSync(path.join(dist, 'icons'))) console.warn('warning: no icons in static/icons — run `npm run icons`');
  console.log('built → dist/');
}
