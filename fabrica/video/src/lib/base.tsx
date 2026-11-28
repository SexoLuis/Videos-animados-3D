/**
 * Biblioteca base de la fábrica (estilo «barbudo cartoon»).
 * Utilidades de animación, fondos con viñeta, bokeh, cámara, subtítulos, marca de agua y la plantilla de video.
 */
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, Easing, staticFile, useCurrentFrame, getInputProps } from 'remotion';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';

export const FPS = 30;
export const INK = '#1a1218'; // contorno de todo
export const SW = 6; // grosor de contorno

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
export const ip = (f: number, i: number[], o: number[], ease = EASE) =>
  interpolate(f, i, o, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
export const lin = (f: number, i: number[], o: number[]) => interpolate(f, i, o, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
export const pop = (f: number, start: number, damping = 11, stiffness = 150) =>
  f < start ? 0 : spring({ frame: f - start, fps: FPS, config: { damping, stiffness } });
export const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export const shake = (f: number, amp: number, seed = 0) => [
  amp * (Math.sin(f * 2.3 + seed) * 0.6 + Math.sin(f * 5.1 + seed * 3) * 0.4),
  amp * 0.6 * (Math.cos(f * 2.9 + seed * 2) * 0.6 + Math.sin(f * 4.3 + seed) * 0.4),
];
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b), k = Math.max(0, Math.min(1, t));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

/** Fondos oscuros con viñeta del estilo */
export const FONDOS = {
  ciruela: ['#5e2150', '#140812'],
  noche: ['#2a3a66', '#0b0e1e'],
  grisMorado: ['#3d2c40', '#110b14'],
  calor: ['#7a2432', '#1a0810'],
  verdoso: ['#24524a', '#081410'],
  ambar: ['#6a4a22', '#160e06'],
} as const;
export type Fondo = keyof typeof FONDOS;

/** Lienzo SVG 1080x1920 con fondo de viñeta radial y bokeh */
export const Stage: React.FC<{ fondo?: Fondo; colores?: [string, string]; bokeh?: boolean; children: React.ReactNode }> = ({ fondo = 'ciruela', colores, bokeh = true, children }) => {
  const [a, b] = colores ?? FONDOS[fondo];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="vineta" cx="50%" cy="55%" r="75%"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#vineta)" />
      {children}
      {bokeh && <Bokeh />}
    </svg>
  );
};

/** Puntitos de bokeh naranja flotando */
export const Bokeh: React.FC<{ n?: number; color?: string }> = ({ n = 18, color = '#ffb04a' }) => {
  const f = useCurrentFrame();
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const y = 1920 - ((f * (0.4 + rnd(i) * 1.1) + rnd(i + 9) * 1920) % 2000);
        const x = rnd(i + 3) * 1080 + Math.sin((f + i * 30) / 40) * 18;
        return <circle key={i} cx={x} cy={y} r={6 + rnd(i + 5) * 14} fill={color} opacity={0.08 + rnd(i + 7) * 0.14} />;
      })}
    </g>
  );
};

/** Cámara: centra (cx,cy) con zoom s y rotación r */
export const Cam: React.FC<{ cx: number; cy: number; s: number; r?: number; children: React.ReactNode }> = ({ cx, cy, s, r = 0, children }) => (
  <g transform={`translate(540,960) rotate(${r}) scale(${s}) translate(${-cx},${-cy})`}>{children}</g>
);

/** Gota de sudor azul con contorno */
export const Gota: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <path transform={`translate(${x},${y}) scale(${s})`} opacity={o} d="M0,-22 C10,-6 16,4 16,13 A16,16 0 0 1 -16,13 C-16,4 -10,-6 0,-22 Z"
    fill="#6ec8ff" stroke={INK} strokeWidth={4} />
);

/** Zzz de sueño */
export const Zzz: React.FC<{ x: number; y: number; o?: number; s?: number }> = ({ x, y, o = 1, s = 1 }) => {
  const f = useCurrentFrame();
  return (
    <g opacity={o}>
      {[0, 1, 2].map((k) => {
        const p = ((f + k * 20) % 60) / 60;
        const sz = (26 + k * 10) * s;
        const xx = x + p * 90 * s + k * 10, yy = y - p * 160 * s;
        return <path key={k} transform={`translate(${xx},${yy})`} opacity={1 - p} d={`M0,0 h${sz} l${-sz},${sz} h${sz}`}
          fill="none" stroke="#fff" strokeWidth={8 * s} strokeLinejoin="round" strokeLinecap="round" />;
      })}
    </g>
  );
};

// ---------- subtítulos ----------
export type Palabra = { w: string; start: number; end: number };
const norm = (w: string) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\wñÑ]/g, '').toUpperCase();
export const trocear = (palabras: Palabra[]) => {
  const out: Palabra[][] = []; let cur: Palabra[] = [];
  palabras.forEach((p) => { cur.push(p); if (/[,.?!:;…]$/.test(p.w) || cur.length >= 5) { out.push(cur); cur = []; } });
  if (cur.length) out.push(cur);
  return out;
};

/** Subtítulos arriba: pendientes atenuadas, dichas en blanco, clave en recuadro lima */
export const Subtitulos: React.FC<{ palabras: Palabra[]; claves: string[] }> = ({ palabras, claves }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const trozos = React.useMemo(() => trocear(palabras), [palabras]);
  const set = React.useMemo(() => new Set(claves.map(norm)), [claves]);
  const fin = (i: number) => (trozos[i + 1] ? trozos[i + 1][0].start - 0.05 : trozos[i][trozos[i].length - 1].end + 0.8);
  const idx = trozos.findIndex((c, i) => t >= c[0].start - 0.12 && t < fin(i));
  if (idx < 0) return null;
  const c = trozos[idx];
  const o = interpolate(t, [c[0].start - 0.12, c[0].start, fin(idx) - 0.15, fin(idx)], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sc = interpolate(t, [c[0].start - 0.12, c[0].start + 0.08], [0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  let n = 0;
  return (
    <div style={{ position: 'absolute', top: 210, left: 80, width: 920, textAlign: 'center', opacity: o, transform: `scale(${sc})`, lineHeight: 1.3 }}>
      {c.map((p, i) => {
        const dicha = t >= p.start - 0.03;
        const clave = set.has(norm(p.w)) && n < 2;
        if (clave) n++;
        return (
          <span key={i} style={{
            display: 'inline-block', margin: '0 8px', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 64,
            color: clave ? '#14210a' : '#fff', opacity: clave || dicha ? 1 : 0.45,
            background: clave ? '#aef04e' : 'transparent', borderRadius: 10, padding: clave ? '0 12px' : 0,
            transform: clave && dicha ? `scale(${1 + 0.06 * Math.max(0, 1 - (t - p.start) * 4)})` : 'none',
            textShadow: clave ? 'none' : '0 4px 0 rgba(10,6,12,.9), 0 0 18px rgba(0,0,0,.6)',
            boxShadow: clave ? '0 4px 0 rgba(10,6,12,.9)' : 'none',
          }}>{p.w.toUpperCase()}</span>
        );
      })}
    </div>
  );
};

export const MarcaDeAgua: React.FC = () => (
  <div style={{ position: 'absolute', bottom: 150, width: '100%', textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 800,
    fontSize: 44, color: 'rgba(255,255,255,.92)', WebkitTextStroke: '2px rgba(20,10,20,.9)', paintOrder: 'stroke fill', textShadow: '0 3px 8px rgba(0,0,0,.7)' }}>@CortoYCurioso</div>
);

const Fade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: first ? 1 : interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' }) }}>{children}</AbsoluteFill>;
};

/**
 * Plantilla de video: planos [inicio en fotogramas, componente], subtítulos, marca y audio.
 * Cada plano se alarga 10 fotogramas para el fundido con el siguiente.
 */
export const Video: React.FC<{ planos: [number, React.FC][]; total: number; palabras: Palabra[]; claves: string[]; audio?: string }> = ({ planos, total, palabras, claves, audio = 'mezcla.wav' }) => (
  <AbsoluteFill style={{ background: '#0b0e1e' }}>
    {planos.map(([start, C], i) => {
      const end = i + 1 < planos.length ? planos[i + 1][0] : total;
      return (
        <Sequence key={i} from={start} durationInFrames={end - start + (i + 1 < planos.length ? 10 : 0)}>
          <Fade first={i === 0}><C /></Fade>
        </Sequence>
      );
    })}
    <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(8,4,10,.55) 0%, rgba(8,4,10,0) 26%)' }} />
    <Subtitulos palabras={palabras} claves={claves} />
    <MarcaDeAgua />
    <Audio src={staticFile(((getInputProps() as { audio?: string }).audio) ?? audio)} />
  </AbsoluteFill>
);
