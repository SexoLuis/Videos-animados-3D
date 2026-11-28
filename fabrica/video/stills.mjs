import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const comp = await selectComposition({ serveUrl, id: process.env.COMP || 'Video', browserExecutable: '/usr/bin/google-chrome' });
for (const f of frames) {
  await renderStill({ composition: comp, serveUrl, frame: f, output: `../stills/f${String(f).padStart(4, '0')}.png`, scale: 0.5, browserExecutable: '/usr/bin/google-chrome', chromiumOptions: { gl: 'swangle' } });
  console.log('ok', f);
}
