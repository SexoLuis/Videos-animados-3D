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

/**
 * Subtítulos arriba, sobrios: blanco con sombra suave, sin recuadros. Cada palabra aparece cuando se dice
 * (sube y se aclara); la palabra clave se pinta en amarillo suave con un pequeño salto.
 */
export const Subtitulos: React.FC<{ palabras: Palabra[]; claves: string[] }> = ({ palabras, claves }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const trozos = React.useMemo(() => trocear(palabras), [palabras]);
  const set = React.useMemo(() => new Set(claves.map(norm)), [claves]);
  const fin = (i: number) => (trozos[i + 1] ? trozos[i + 1][0].start - 0.05 : trozos[i][trozos[i].length - 1].end + 0.8);
  const idx = trozos.findIndex((c, i) => t >= c[0].start - 0.1 && t < fin(i));
  if (idx < 0) return null;
  const c = trozos[idx];
  const o = interpolate(t, [fin(idx) - 0.12, fin(idx)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  let n = 0;
  return (
    <div style={{ position: 'absolute', top: 220, left: 90, width: 900, textAlign: 'center', opacity: o, lineHeight: 1.25 }}>
      {c.map((p, i) => {
        const k = Math.max(0, Math.min(1, (t - p.start + 0.06) / 0.12));
        const clave = set.has(norm(p.w)) && n < 1;
        if (clave) n++;
        const salto = clave ? 1 + 0.12 * Math.max(0, Math.sin(Math.min(1, (t - p.start) / 0.25) * Math.PI)) : 1;
        return (
          <span key={i} style={{
            display: 'inline-block', margin: '0 9px', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 60, letterSpacing: 0.5,
            color: clave ? '#ffe08a' : '#ffffff', opacity: 0.25 + 0.75 * k,
            transform: `translateY(${(1 - k) * 14}px) scale(${salto})`,
            textShadow: '0 3px 0 rgba(0,0,0,.55), 0 0 14px rgba(0,0,0,.55)',
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

// ---------- transiciones ----------
export type Transicion = 'fundido' | 'zoom' | 'barrido' | 'empuje' | 'iris' | 'destello';
export const T_TRANS = 12; // fotogramas que dura cada transición
const EZ = Easing.bezier(0.65, 0, 0.35, 1);
const cl = (x: number) => Math.max(0, Math.min(1, x));

/** Envuelve un plano y aplica la transición de entrada (la suya) y de salida (la del plano siguiente). */
const Plano: React.FC<{ dur: number; entra?: Transicion; sale?: Transicion; children: React.ReactNode }> = ({ dur, entra, sale, children }) => {
  const f = useCurrentFrame();
  const pi = entra ? EZ(cl(f / T_TRANS)) : 1;
  const po = sale ? EZ(cl((f - dur) / T_TRANS)) : 0;
  let opacity = 1, tx = 0, ty = 0, sc = 1 + 0.035 * cl(f / Math.max(1, dur)), blur = 0, clip: string | undefined, flash = 0;
  if (entra && pi < 1) {
    if (entra === 'fundido') opacity = pi;
    if (entra === 'zoom') { opacity = cl(pi * 1.6); sc *= 1.35 - 0.35 * pi; blur += (1 - pi) * 10; }
    if (entra === 'barrido') { tx += (1 - pi) * 1080; blur += Math.sin(pi * Math.PI) * 8; }
    if (entra === 'empuje') { ty += (1 - pi) * 1920; }
    if (entra === 'iris') clip = `circle(${pi * 1250}px at 50% 55%)`;
    if (entra === 'destello') { opacity = cl(pi * 3); flash = (1 - pi) * 0.85; }
  }
  if (sale && po > 0) {
    if (sale === 'zoom') { sc *= 1 + 0.6 * po; blur += po * 10; }
    if (sale === 'barrido') { tx -= po * 1080; blur += Math.sin(po * Math.PI) * 8; }
    if (sale === 'empuje') { ty -= po * 600; opacity *= 1 - po * 0.5; }
    if (sale === 'iris') sc *= 1 + 0.08 * po;
  }
  return (
    <AbsoluteFill style={{ opacity, clipPath: clip, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${tx}px,${ty}px) scale(${sc})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
    </AbsoluteFill>
  );
};

/** Golpes de zoom: pequeño acercamiento rápido en cada instante (segundos), que se relaja solo. */
const Golpes: React.FC<{ tiempos: number[]; children: React.ReactNode }> = ({ tiempos, children }) => {
  const f = useCurrentFrame();
  let k = 0;
  for (const g of tiempos) {
    const d = f - g * FPS;
    if (d >= 0 && d < 30) k += d < 4 ? (d / 4) * 0.055 : 0.055 * Math.exp(-(d - 4) / 7);
  }
  return <AbsoluteFill style={{ transform: `scale(${1 + k})` }}>{children}</AbsoluteFill>;
};

export type PlanoDef = [number, React.FC] | [number, React.FC, Transicion];
const ROTACION: Transicion[] = ['zoom', 'barrido', 'fundido', 'empuje', 'iris', 'zoom', 'destello', 'barrido'];

/**
 * Plantilla de video: planos [inicio en fotogramas, componente, transición de entrada opcional],
 * subtítulos sobrios, golpes de zoom en las palabras clave, marca de agua y audio.
 * Si un plano no dice su transición, se usa una rotación variada.
 */
export const Video: React.FC<{ planos: PlanoDef[]; total: number; palabras: Palabra[]; claves: string[]; audio?: string; golpes?: number[] }> = ({ planos, total, palabras, claves, audio = 'mezcla.wav', golpes }) => {
  const trans = planos.map((p, i) => (i === 0 ? undefined : (p[2] ?? ROTACION[(i - 1) % ROTACION.length])));
  // golpes automáticos: la primera palabra clave de cada frase, separados al menos 1,5 s
  const auto = React.useMemo(() => {
    if (golpes) return golpes;
    const set = new Set(claves.map(norm)); const out: number[] = [];
    trocear(palabras).forEach((c) => { const k = c.find((p) => set.has(norm(p.w))); if (k && (!out.length || k.start - out[out.length - 1] > 1.5)) out.push(k.start); });
    return out;
  }, [palabras, claves, golpes]);
  return (
    <AbsoluteFill style={{ background: '#0b0e1e' }}>
      <Golpes tiempos={auto}>
        {planos.map(([start, C], i) => {
          const end = i + 1 < planos.length ? planos[i + 1][0] : total;
          const hay = i + 1 < planos.length;
          return (
            <Sequence key={i} from={start} durationInFrames={end - start + (hay ? T_TRANS : 0)}>
              <Plano dur={end - start} entra={trans[i]} sale={hay ? trans[i + 1] : undefined}><C /></Plano>
            </Sequence>
          );
        })}
      </Golpes>
      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(8,4,10,.45) 0%, rgba(8,4,10,0) 24%)' }} />
      <Subtitulos palabras={palabras} claves={claves} />
      <MarcaDeAgua />
      <Audio src={staticFile(((getInputProps() as { audio?: string }).audio) ?? audio)} />
    </AbsoluteFill>
  );
};
