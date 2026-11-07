// Renderizador de escenas: HTML animado -> fotogramas -> MP4 (vía ffmpeg).
// Uso: node render.cjs spec.json   (lo invoca escenas.py)
// Requiere el paquete "playwright" con Chromium instalado.
'use strict';
const fs = require('fs');
const { spawn } = require('child_process');

let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  console.error('[render] No se encuentra el paquete "playwright" de Node. Ejecuta: npm install && npx playwright install chromium');
  process.exit(2);
}

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const { fps, ancho, alto } = spec;

function escribir(stream, buf) {
  return new Promise(res => { if (stream.write(buf)) res(); else stream.once('drain', res); });
}

// Con varios Chromium en paralelo y sin GPU, captureScreenshot falla de forma
// intermitente ("Unable to capture screenshot"); se reintenta.
async function capturar(page, opciones) {
  for (let intento = 1; ; intento++) {
    try { return await page.screenshot(opciones); }
    catch (e) {
      if (intento >= 5 || !/Unable to capture screenshot/.test(e.message)) throw e;
      await new Promise(r => setTimeout(r, 150 * intento));
    }
  }
}

async function abrir(browser, ruta) {
  const page = await browser.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  page.on('pageerror', err => console.error(`[render] error JS en ${ruta}: ${err.message}`));
  await page.goto('file://' + ruta);
  await page.evaluate(() => window.__listo);
  return page;
}

async function video(browser, t) {
  const page = await abrir(browser, t.html);
  const total = Math.round(t.duracion * fps);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(fps), t.salida],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  let errorFF = null;
  ff.stdin.on('error', e => { errorFF = e; });
  const fin = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg salió con código ' + c))));
  for (let f = 0; f < total; f++) {
    await page.evaluate(ms => window.__seek(ms), (f * 1000) / fps);
    const buf = await capturar(page, { type: 'jpeg', quality: 92 });
    if (errorFF) throw new Error('ffmpeg dejó de aceptar fotogramas: ' + errorFF.message);
    await escribir(ff.stdin, buf);
  }
  ff.stdin.end();
  await fin;
  await page.close();
  return total;
}

async function capturas(browser, t) {
  const page = await abrir(browser, t.html);
  for (const [seg, salida] of t.capturas) {
    await page.evaluate(ms => window.__seek(ms), seg * 1000);
    await capturar(page, { path: salida, type: 'png' });
  }
  await page.close();
  return t.capturas.length;
}

(async () => {
  // Un navegador por trabajador: varias páginas simultáneas en el mismo
  // Chromium sin GPU provocan "Unable to capture screenshot".
  const navegadores = [];
  const cola = spec.trabajos.map((t, i) => ({ ...t, i }));
  const t0 = Date.now();
  let hechos = 0;
  async function trabajador() {
    const browser = await chromium.launch();
    navegadores.push(browser);
    while (cola.length) {
      const t = cola.shift();
      const ini = Date.now();
      const n = t.capturas ? await capturas(browser, t) : await video(browser, t);
      hechos++;
      console.log(`  [render] escena ${t.i + 1}: ${n} ${t.capturas ? 'capturas' : 'fotogramas'} en ${((Date.now() - ini) / 1000).toFixed(1)} s (${hechos}/${spec.trabajos.length})`);
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(spec.concurrencia || 2, cola.length) }, trabajador));
  } catch (e) {
    console.error('[render] ' + e.message);
    await Promise.all(navegadores.map(b => b.close()));
    process.exit(1);
  }
  await Promise.all(navegadores.map(b => b.close()));
  console.log(`  [render] total ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})();
