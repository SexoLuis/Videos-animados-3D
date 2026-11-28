import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from 'remotion';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import tiempos from './tiempos.json';
import * as E from './Escenas';
import { FPS } from './common';

export const TOTAL = 1600;
const FADE = 10;

// [inicio, componente] — los cortes siguen la narración (ver BRIEF.md)
const PLANOS: [number, React.FC][] = [
  [0, E.S1A], [104, E.S1B], [168, E.S2A], [240, E.S2B], [348, E.S2C], [486, E.S2D],
  [647, E.S3A], [738, E.S4], [836, E.S3B], [936, E.S3C],
  [1023, E.S5A], [1167, E.S5B], [1257, E.S5C], [1356, E.S6A], [1485, E.S6B],
];

const Fade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  const o = first ? 1 : interpolate(f, [0, FADE], [0, 1], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// ---------- subtítulos ----------
const norm = (w: string) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\wñÑ]/g, '').toUpperCase();
const CLAVES = new Set(['FIEBRE', 'CONGELANDO', 'ARDIENDO', 'CEREBRO', 'TEMPERATURA', 'TERMOSTATO', '37', '39', 'CALIENTE', 'CALOR',
  'TEMBLAR', 'COBIJAS', 'HELADOS', 'TEMBLORES', 'BAJAR', 'SUDAR', 'DERRITIENDO', 'HORAS', 'CONTRARIO', 'ENFERMAS']);
type W = { w: string; start: number; end: number };
const palabras: W[] = tiempos.palabras;
const trozos: W[][] = [];
{
  let cur: W[] = [];
  palabras.forEach((p) => {
    cur.push(p);
    if (/[,.?!:;]$/.test(p.w) || cur.length >= 5) { trozos.push(cur); cur = []; }
  });
  if (cur.length) trozos.push(cur);
}

const Subtitulos: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const idx = trozos.findIndex((c, i) => t >= c[0].start - 0.05 && t < (trozos[i + 1] ? trozos[i + 1][0].start - 0.05 : c[c.length - 1].end + 0.6));
  if (idx < 0) return null;
  const c = trozos[idx];
  const endT = trozos[idx + 1] ? trozos[idx + 1][0].start - 0.05 : c[c.length - 1].end + 0.6;
  const out = interpolate(t, [endT - 6 / FPS, endT], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  let claves = 0;
  return (
    <div style={{ position: 'absolute', top: 190, left: 60, width: 960, textAlign: 'center', opacity: out, lineHeight: 1.28 }}>
      {c.map((p, i) => {
        const k = (f - p.start * FPS) / 4;
        const a = Math.max(0, Math.min(1, k));
        const n = norm(p.w);
        const clave = CLAVES.has(n) && claves < 2;
        if (clave) claves++;
        const txt = p.w.toUpperCase();
        return (
          <span key={i} style={{ display: 'inline-block', margin: '0 10px', opacity: a, transform: `translateY(${(1 - a) * 24}px)`,
            fontFamily: 'Poppins, Montserrat, sans-serif', fontWeight: 800, fontSize: 78, color: clave ? '#1b0b24' : '#fff',
            background: clave ? '#ffc83d' : 'transparent', padding: clave ? '0 16px' : 0, borderRadius: 18,
            textShadow: clave ? 'none' : '0 6px 0 rgba(20,6,30,.85), 0 0 24px rgba(0,0,0,.5)',
            boxShadow: clave ? '0 6px 0 rgba(20,6,30,.85), 0 0 30px rgba(255,200,61,.45)' : 'none' }}>{txt}</span>
        );
      })}
    </div>
  );
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{ background: '#06081a' }}>
    {PLANOS.map(([start, C], i) => {
      const end = i + 1 < PLANOS.length ? PLANOS[i + 1][0] : TOTAL;
      return (
        <Sequence key={i} from={start} durationInFrames={end - start + (i + 1 < PLANOS.length ? FADE : 0)}>
          <Fade first={i === 0}><C /></Fade>
        </Sequence>
      );
    })}
    {/* viñeta y degradado superior para legibilidad */}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(10,3,16,.55) 0%, rgba(10,3,16,0) 28%)' }} />
    <Subtitulos />
    <div style={{ position: 'absolute', bottom: 150, width: '100%', textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 800,
      fontSize: 44, color: 'rgba(255,255,255,.85)', textShadow: '0 2px 6px rgba(0,0,0,.8), 0 0 2px rgba(0,0,0,.9)' }}>@CortoYCurioso</div>
    <Audio src={staticFile('mezcla.wav')} />
  </AbsoluteFill>
);
