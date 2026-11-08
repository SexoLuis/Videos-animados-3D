import React from 'react';
import {
  AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import tiempos from '../public/tiempos.json';

const FPS = 30;
const T = 12; // fotogramas de transición
// cortes de escena (fotogramas): justo antes de que empiece la voz siguiente
const CORTES = [0, Math.round((tiempos.escenas[1].inicio_voz - 0.2) * FPS), Math.round((tiempos.escenas[2].inicio_voz - 0.2) * FPS), 450];
const AMARILLO = '#ffd23f';
const FUENTE = '"Inter Display", Inter, sans-serif';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// ---------- piezas comunes ----------
const Burbujas: React.FC<{ n?: number; semilla?: number }> = ({ n = 28, semilla = 1 }) => {
  const f = useCurrentFrame();
  const r = (i: number) => { const x = Math.sin(i * 12.9898 + semilla * 78.233) * 43758.5453; return x - Math.floor(x); };
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const vel = 2 + r(i) * 5;
        const y = 2000 - ((f * vel + r(i + 50) * 2100) % 2200);
        const x = r(i + 100) * 1080 + Math.sin((f + i * 20) / 18) * 14;
        const s = 6 + r(i + 7) * 18;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,.45)', background: 'rgba(255,255,255,.08)' }} />;
      })}
    </>
  );
};

const Rayos: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}>
      <defs>
        <linearGradient id="rayo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfefff" stopOpacity=".35" />
          <stop offset="1" stopColor="#bfefff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 120 + i * 220 + Math.sin((f + i * 30) / 40) * 40;
        return <polygon key={i} points={`${x},0 ${x + 90},0 ${x + 260},1500 ${x - 120},1500`} fill="url(#rayo)"
          opacity={0.5 + 0.3 * Math.sin((f + i * 17) / 25)} />;
      })}
    </svg>
  );
};

const Tiburon: React.FC<{ ancho: number; color?: string; colet?: number }> = ({ ancho, color = '#5d7f93', colet = 0 }) => (
  <svg width={ancho} height={ancho * 0.4} viewBox="0 0 600 240" style={{ overflow: 'visible' }}>
    <g style={{ transformOrigin: '135px 120px', transform: `skewY(${colet}deg)` }}>
      <path d="M140,118 L30,36 L70,118 L28,206 Z" fill={color} />
    </g>
    <path d="M120,118 C210,74 300,62 340,62 L385,8 L405,66 C470,70 540,92 592,120 C548,142 480,158 410,162 L432,214 L372,166 C300,170 200,165 120,124 Z" fill={color} />
    <path d="M150,126 C260,160 420,170 560,134 C540,146 480,158 410,162 C330,170 230,164 150,126 Z" fill="#dfe9ee" opacity=".9" />
    <path d="M520,138 Q550,132 584,124" stroke="#1d2b35" strokeWidth="4" fill="none" />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${452 + i * 13},98 q-6,18 0,36`} stroke="#3b5566" strokeWidth="4" fill="none" />)}
    <circle cx="528" cy="106" r="7" fill="#0b1720" />
    <path d="M300,170 L280,214 L330,168 Z" fill={color} />
  </svg>
);

// ---------- escenas ----------
const Escena1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(f, [0, 130], [1, 1.12]);
  const x = interpolate(f, [0, 125], [-560, 1150], { easing: Easing.inOut(Easing.cubic) });
  const titulo = spring({ frame: f - 10, fps, config: { damping: 11 } });
  const kicker = spring({ frame: f - 4, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(120% 80% at 50% 0%, #0f6d9c 0%, #06243d 55%, #020b14 100%)', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Rayos />
        <div style={{ position: 'absolute', left: x + 300, top: 1150, opacity: 0.35, filter: 'blur(3px)' }}>
          <Tiburon ancho={380} color="#2e4f63" colet={Math.sin(f / 4) * 10} />
        </div>
        <div style={{ position: 'absolute', left: x, top: 820 + Math.sin(f / 12) * 25, transform: `rotate(${Math.sin(f / 14) * 3}deg)` }}>
          <Tiburon ancho={980} colet={Math.sin(f / 5) * 12} />
        </div>
        <Burbujas />
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 300, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', transform: `translateY(${(1 - kicker) * -80}px)`, opacity: kicker,
          background: AMARILLO, color: '#04192b', font: `800 40px ${FUENTE}`, letterSpacing: 6, padding: '14px 32px', borderRadius: 999 }}>
          EL REY DEL OCÉANO
        </div>
        <div style={{ marginTop: 34, color: '#fff', font: `900 150px ${FUENTE}`, letterSpacing: -4,
          transform: `scale(${0.6 + 0.4 * titulo})`, opacity: titulo, textShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
          MEGALODÓN
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Escena2: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abrir = interpolate(f, [0, 25], [0.15, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // mordisco a los 2,6 s
  const mordida = f < 78 ? abrir : interpolate(f, [78, 84, 100], [1, 0.05, 0.35], clamp);
  const sacudida = f >= 82 && f < 96 ? Math.sin(f * 2.3) * (96 - f) * 1.4 : 0;
  const zoom = interpolate(f, [0, 170], [1.05, 1.18]);
  const dientes = (arriba: boolean) => Array.from({ length: 9 }).map((_, i) => {
    const s = spring({ frame: f - 6 - i * 2, fps, config: { damping: 10 } });
    const x = 90 + i * 100;
    const h = 120 - Math.abs(i - 4) * 12;
    return <polygon key={i} points={arriba ? `${x},0 ${x + 84},0 ${x + 42},${h * s}` : `${x},0 ${x + 84},0 ${x + 42},${-h * s}`}
      fill="#f4f1e6" stroke="#c9c2a8" strokeWidth="4" />;
  });
  const texto = spring({ frame: f - 30, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(90% 60% at 50% 45%, #6b1020 0%, #2a0610 60%, #0c0205 100%)', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) translate(${sacudida}px, ${sacudida * 0.6}px)` }}>
        <svg width={1080} height={1920} style={{ position: 'absolute' }}>
          <ellipse cx="540" cy="900" rx="520" ry={60 + 330 * mordida} fill="#150307" />
          <g transform={`translate(0, ${900 - 330 * mordida - 20})`}>
            <path d={`M0,-1400 L1080,-1400 L1080,20 Q540,${-60} 0,20 Z`} fill="#5d7f93" />
            <g transform="translate(0,0)">{dientes(true)}</g>
          </g>
          <g transform={`translate(0, ${900 + 330 * mordida + 20})`}>
            <path d={`M0,1400 L1080,1400 L1080,-20 Q540,${60} 0,-20 Z`} fill="#dfe9ee" />
            <g>{dientes(false)}</g>
          </g>
        </svg>
        <Burbujas n={14} semilla={4} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 240, width: '100%', textAlign: 'center', color: '#fff',
        font: `900 96px ${FUENTE}`, letterSpacing: -2, opacity: texto, transform: `translateY(${(1 - texto) * 60}px)`,
        textShadow: '0 10px 30px rgba(0,0,0,.6)' }}>
        Dientes de <span style={{ color: AMARILLO }}>18 cm</span>
      </div>
    </AbsoluteFill>
  );
};

const Escena3: React.FC = () => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, 170], [1, 1.06]);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* clip generado con la skill /graph (HyperFrames) */}
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo src={staticFile('longitud.graph.mp4')} muted />
      </AbsoluteFill>
      <div style={{ position: 'absolute', right: 60, top: 400, opacity: interpolate(f, [100, 125], [0, 1], clamp),
        transform: `translateX(${interpolate(f, [100, 125], [80, 0], clamp)}px)` }}>
        <Tiburon ancho={300} color="#9fb3bf" colet={Math.sin(f / 5) * 10} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- subtítulos ----------
type Pal = { t: string; a: number; b: number };
const grupos: Pal[][] = [];
for (const e of tiempos.escenas) {
  let g: Pal[] = [];
  for (const p of e.palabras as Pal[]) {
    g.push(p);
    if (g.length >= 3 || /[.,:;!?]$/.test(p.t)) { grupos.push(g); g = []; }
  }
  if (g.length) grupos.push(g);
}

const Subtitulos: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const gi = grupos.findIndex((g, i) => t >= g[0].a && t < (grupos[i + 1] ? Math.min(grupos[i + 1][0].a, g[g.length - 1].b + 0.25) : g[g.length - 1].b + 0.4));
  if (gi < 0) return null;
  const g = grupos[gi];
  const ent = interpolate(t - g[0].a, [0, 0.09], [0.85, 1], clamp);
  return (
    <div style={{ position: 'absolute', top: 1390, width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
      gap: '0 40px', boxSizing: 'border-box', transform: `scale(${ent})`,
      font: `900 84px ${FUENTE}`, letterSpacing: 1, color: '#fff', textTransform: 'uppercase',
      WebkitTextStroke: '3px #101010', paintOrder: 'stroke fill', textShadow: '0 6px 0 rgba(0,0,0,.55)', padding: '0 70px' }}>
      {g.map((p, i) => {
        const activa = t >= p.a && (i === g.length - 1 || t < g[i + 1].a);
        return <span key={i} style={{ color: activa ? AMARILLO : '#fff', display: 'inline-block',
          transform: activa ? 'scale(1.08)' : 'none' }}>{p.t}</span>;
      })}
    </div>
  );
};

// ---------- música con ducking ----------
const hablando = (t: number) => tiempos.escenas.some((e) => t > e.inicio_voz - 0.1 && t < e.inicio_voz + e.dur_voz + 0.15);
const volumenMusica = (f: number) => {
  const t = f / FPS;
  // media móvil de 0,3 s para suavizar la bajada/subida
  let s = 0; for (let k = -4; k <= 4; k++) s += hablando(t + k / FPS) ? 0.12 : 0.42;
  const base = s / 9;
  return base * interpolate(f, [0, 20, 420, 450], [0, 1, 1, 0], clamp);
};

// ---------- composición ----------
const Transicion: React.FC<{ children: React.ReactNode; dur: number; primera?: boolean; tipo: 'fade' | 'slide' }> = ({ children, dur, primera, tipo }) => {
  const f = useCurrentFrame();
  const entrada = primera ? 1 : interpolate(f, [0, T], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const estilo: React.CSSProperties = tipo === 'slide'
    ? { transform: `translateY(${(1 - entrada) * 1920}px)` }
    : { opacity: entrada, transform: `scale(${1.15 - 0.15 * entrada})` };
  return <AbsoluteFill style={estilo}>{children}</AbsoluteFill>;
};

export const Megalodon: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Sequence from={CORTES[0]} durationInFrames={CORTES[1] - CORTES[0] + T}>
      <Transicion dur={CORTES[1]} primera tipo="fade"><Escena1 /></Transicion>
    </Sequence>
    <Sequence from={CORTES[1]} durationInFrames={CORTES[2] - CORTES[1] + T}>
      <Transicion dur={CORTES[2] - CORTES[1]} tipo="slide"><Escena2 /></Transicion>
    </Sequence>
    <Sequence from={CORTES[2]} durationInFrames={CORTES[3] - CORTES[2]}>
      <Transicion dur={CORTES[3] - CORTES[2]} tipo="fade"><Escena3 /></Transicion>
    </Sequence>
    <Subtitulos />
    <Audio src={staticFile('narracion.wav')} />
    <Audio src={staticFile('musica.wav')} volume={volumenMusica} />
  </AbsoluteFill>
);
