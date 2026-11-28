import React from 'react';
import { interpolate, spring, Easing, useCurrentFrame } from 'remotion';

export const FPS = 30;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

/** interpolate con clamp y curva suave */
export const ip = (f: number, i: number[], o: number[], ease = EASE) =>
  interpolate(f, i, o, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
export const lin = (f: number, i: number[], o: number[]) =>
  interpolate(f, i, o, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
/** spring "pop" que vale 0 antes de empezar */
export const pop = (f: number, start: number, damping = 11, stiffness = 150) =>
  f < start ? 0 : spring({ frame: f - start, fps: FPS, config: { damping, stiffness } });

export const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** temblor pseudoaleatorio de alta frecuencia */
export const shake = (f: number, amp: number, seed = 0) => [
  amp * (Math.sin(f * 2.3 + seed) * 0.6 + Math.sin(f * 5.1 + seed * 3) * 0.4),
  amp * 0.6 * (Math.cos(f * 2.9 + seed * 2) * 0.6 + Math.sin(f * 4.3 + seed) * 0.4),
];

// ---------- color ----------
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
/** tono 0 = frío (azul), 1 = calor (rojo), 2 = neutro (ciruela) */
export const tone = (t: number, cold: string, hot: string, neutral: string) =>
  t <= 1 ? mix(cold, hot, t) : mix(hot, neutral, t - 1);

// ---------- cámara ----------
/** <g> de cámara: centra (cx,cy) en pantalla con zoom s y rotación r */
export const Cam: React.FC<{ cx: number; cy: number; s: number; r?: number; dx?: number; dy?: number; children: React.ReactNode }> = ({ cx, cy, s, r = 0, dx = 0, dy = 0, children }) => (
  <g transform={`translate(${540 + dx},${960 + dy}) rotate(${r}) scale(${s}) translate(${-cx},${-cy})`}>{children}</g>
);

export const Stage: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = '#06081a' }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, background: bg }}>
    <Defs />
    {children}
  </svg>
);

export const Defs: React.FC = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="glowS" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="blur20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20" /></filter>
    <filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
    <radialGradient id="nose" cx="40%" cy="35%" r="65%">
      <stop offset="0" stopColor="#ffd0c8" />
      <stop offset=".35" stopColor="#ff4a4a" />
      <stop offset="1" stopColor="#a5101e" />
    </radialGradient>
    <radialGradient id="shine" cx="50%" cy="50%" r="50%">
      <stop offset="0" stopColor="#fff" stopOpacity=".9" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="knit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#8f97a8" />
      <stop offset="1" stopColor="#4c5263" />
    </linearGradient>
    <radialGradient id="pompom" cx="40%" cy="35%" r="65%">
      <stop offset="0" stopColor="#ff8a8a" />
      <stop offset="1" stopColor="#b3122a" />
    </radialGradient>
    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#000" stopOpacity=".0" />
      <stop offset="1" stopColor="#000" stopOpacity=".55" />
    </linearGradient>
  </defs>
);

/** halo luminoso (círculo con degradado radial, barato de renderizar) */
export const Halo: React.FC<{ x: number; y: number; r: number; color: string; o?: number }> = ({ x, y, r, color, o = 1 }) => {
  const id = 'h' + color.replace('#', '') + Math.round(r);
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity=".85" />
          <stop offset=".4" stopColor={color} stopOpacity=".3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </g>
  );
};

/** partículas flotantes (polvo luminoso) */
export const Motes: React.FC<{ color: string; n?: number; seed?: number; speed?: number; o?: number }> = ({ color, n = 26, seed = 1, speed = 1, o = 0.6 }) => {
  const f = useCurrentFrame();
  return (
    <g opacity={o}>
      {Array.from({ length: n }).map((_, i) => {
        const r = (k: number) => rnd(i * 7 + seed * 31 + k);
        const y = 1920 - ((f * (0.6 + r(1) * 1.6) * speed + r(2) * 1920) % 1980);
        const x = r(3) * 1080 + Math.sin((f + i * 40) / 30) * 20;
        const s = 2 + r(4) * 6;
        return <circle key={i} cx={x} cy={y} r={s} fill={color} opacity={0.3 + r(5) * 0.6} />;
      })}
    </g>
  );
};

/** destello de cuatro puntas */
export const Sparkle: React.FC<{ x: number; y: number; s: number; color?: string; o?: number }> = ({ x, y, s, color = '#fff', o = 1 }) => (
  <path transform={`translate(${x},${y}) scale(${s})`} opacity={o} fill={color}
    d="M0,-20 C2,-6 6,-2 20,0 C6,2 2,6 0,20 C-2,6 -6,2 -20,0 C-6,-2 -2,-6 0,-20 Z" />
);
