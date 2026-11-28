import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY || 'src/index.ts') });
const inputProps = process.env.AUDIO ? { audio: process.env.AUDIO } : {};
const comp = await selectComposition({ serveUrl, id: process.env.COMP || 'Video', inputProps, browserExecutable: '/usr/bin/google-chrome' });
for (const f of frames) {
  await renderStill({ composition: comp, serveUrl, frame: f, inputProps, output: `${process.env.STILLS || '../stills'}/f${String(f).padStart(4, '0')}.png`, scale: 0.5, browserExecutable: '/usr/bin/google-chrome', chromiumOptions: { gl: 'swangle' } });
  console.log('ok', f);
}
