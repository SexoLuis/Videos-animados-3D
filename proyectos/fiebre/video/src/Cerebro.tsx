import React from 'react';
import { useCurrentFrame } from 'remotion';
import { tone, Halo, Motes, rnd, mix } from './common';

/** Sala de control del hipotálamo. t: 0 azul · 1 rojo · 2 cian (enfriamiento) */
export const SalaControl: React.FC<{
  t: number; target: number; level: number; alarm?: number; heaters?: number; fans?: number; lever?: number; buttons?: number;
}> = ({ t, target, level, alarm = 0, heaters = 0, fans = 0, lever = 0, buttons = 0 }) => {
  const f = useCurrentFrame();
  const bgA = tone(t, '#0e2a6a', '#6a0e1e', '#0a4a5a');
  const bgB = tone(t, '#050b24', '#200410', '#03141c');
  const neon = tone(t, '#4fb8ff', '#ff4a3a', '#5ff0ff');
  const neon2 = tone(t, '#c77dff', '#ffa040', '#a0fff0');
  const tubeTop = 600, tubeBot = 1380, tubeH = tubeBot - tubeTop;
  const yLevel = tubeBot - tubeH * level;
  const yTarget = tubeBot - tubeH * target;
  const rot = f * 9;
  return (
    <g>
      <defs>
        <radialGradient id="roombg" cx="50%" cy="40%" r="75%"><stop offset="0" stopColor={bgA} /><stop offset="1" stopColor={bgB} /></radialGradient>
        <linearGradient id="liquid" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#2a7af0" /><stop offset=".55" stopColor="#ff8a3a" /><stop offset="1" stopColor="#ff2a3a" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".25" /><stop offset=".3" stopColor="#fff" stopOpacity=".05" /><stop offset=".8" stopColor="#fff" stopOpacity=".02" /><stop offset="1" stopColor="#fff" stopOpacity=".2" />
        </linearGradient>
        <clipPath id="tubeclip"><rect x={460} y={tubeTop} width={160} height={tubeH} rx={80} /></clipPath>
        <linearGradient id="cone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff2a2a" stopOpacity=".55" /><stop offset="1" stopColor="#ff2a2a" stopOpacity="0" /></linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2520} fill="url(#roombg)" />
      {/* pared curva de neuronas */}
      <g opacity={0.65} fill="none" strokeLinecap="round">
        {Array.from({ length: 16 }).map((_, i) => {
          const y0 = 200 + i * 70;
          const w = Math.sin(f / 25 + i) * 30;
          return <path key={i} d={`M-100,${y0} C200,${y0 - 120 + w} 880,${y0 + 120 - w} 1180,${y0}`} stroke={i % 3 ? neon : neon2} strokeOpacity={0.18} strokeWidth={3} />;
        })}
        {Array.from({ length: 18 }).map((_, i) => {
          const x = rnd(i) * 1080, y = 250 + rnd(i + 5) * 1000;
          const pulse = 0.4 + 0.6 * Math.max(0, Math.sin(f / 8 + i * 1.7));
          return (
            <g key={'n' + i}>
              <circle cx={x} cy={y} r={7} fill={neon2} opacity={pulse} />
              <path d={`M${x},${y} l${(rnd(i + 2) - 0.5) * 160},${(rnd(i + 3) - 0.5) * 160}`} stroke={neon2} strokeOpacity={0.35} strokeWidth={3} />
            </g>
          );
        })}
      </g>
      {/* paneles laterales: calefactores (izq) y ventiladores (der) */}
      {[0, 1].map((side) => {
        const x = side ? 870 : 40;
        return (
          <g key={side}>
            <rect x={x} y={700} width={170} height={620} rx={26} fill="#0a0a1a" stroke={neon} strokeOpacity={0.5} strokeWidth={4} />
            {side === 0 ? (
              Array.from({ length: 7 }).map((_, i) => (
                <g key={i}>
                  <rect x={x + 22} y={740 + i * 80} width={126} height={22} rx={11} fill={mix('#3a1a1a', '#ff5a1a', heaters)} />
                  {heaters > 0.05 && <rect x={x + 10} y={730 + i * 80} width={150} height={42} rx={21} fill="#ff6a1a" opacity={heaters * 0.35} filter="url(#blur6)" />}
                </g>
              ))
            ) : (
              [0, 1].map((k) => (
                <g key={k} transform={`translate(${x + 85},${860 + k * 300})`}>
                  <circle r={70} fill="#06101a" stroke={mix('#204050', '#7ff8ff', fans)} strokeWidth={6} />
                  <g transform={`rotate(${f * 40 * fans + k * 30})`}>
                    {[0, 120, 240].map((a) => <path key={a} transform={`rotate(${a})`} d="M0,0 C20,-20 50,-50 10,-64 C-10,-40 -10,-20 0,0 Z" fill={mix('#305060', '#bff8ff', fans)} />)}
                  </g>
                  <circle r={12} fill="#9fe8ff" />
                  {fans > 0.1 && Array.from({ length: 5 }).map((_, j) => {
                    const p = ((f * 6 + j * 30) % 150) / 150;
                    return <path key={j} d={`M${-90 - p * 300},${-40 + j * 20} q-40,-12 -80,0`} stroke="#bff8ff" strokeWidth={4} opacity={(1 - p) * fans} fill="none" strokeLinecap="round" />;
                  })}
                </g>
              ))
            )}
          </g>
        );
      })}
      {/* termostato gigante */}
      <Halo x={540} y={yLevel} r={380} color={mix('#4fb8ff', '#ff4a2a', level)} o={0.5} />
      <rect x={440} y={tubeTop - 20} width={200} height={tubeH + 40} rx={100} fill="#05060f" stroke={neon} strokeWidth={6} />
      <g clipPath="url(#tubeclip)">
        <rect x={460} y={yLevel} width={160} height={tubeBot - yLevel + 10} fill="url(#liquid)" />
        <ellipse cx={540} cy={yLevel} rx={80} ry={10} fill="#fff" opacity={0.35} />
        {Array.from({ length: 8 }).map((_, i) => {
          const by = tubeBot - ((f * 3 + i * 60) % Math.max(10, tubeBot - yLevel));
          return <circle key={i} cx={480 + rnd(i) * 120} cy={by} r={6} fill="#fff" opacity={0.35} />;
        })}
        <rect x={460} y={tubeTop} width={160} height={tubeH} fill="url(#glass)" />
      </g>
      {/* marcas (sin números) */}
      {Array.from({ length: 13 }).map((_, i) => (
        <rect key={i} x={i % 3 ? 410 : 392} y={tubeTop + 20 + i * ((tubeH - 40) / 12)} width={i % 3 ? 26 : 44} height={6} rx={3} fill={neon} opacity={0.7} />
      ))}
      {/* indicador del objetivo: anillo dorado que abraza el tubo */}
      <g transform={`translate(540,${yTarget})`} filter="url(#glowS)">
        <rect x={-130} y={-14} width={260} height={28} rx={14} fill="none" stroke="#ffc83d" strokeWidth={8} />
        <path d="M150,0 L190,-26 L190,26 Z" fill="#ffc83d" />
        <path d="M-150,0 L-190,-26 L-190,26 Z" fill="#ffc83d" />
      </g>
      {/* baliza de alarma */}
      <g transform="translate(540,545)">
        {alarm > 0 && (
          <g opacity={alarm}>
            <polygon points="0,0 700,-180 700,180" fill="url(#cone)" transform={`rotate(${rot})`} />
            <polygon points="0,0 700,-180 700,180" fill="url(#cone)" transform={`rotate(${rot + 180})`} />
            <Halo x={0} y={0} r={160} color="#ff2a2a" o={0.6 + 0.4 * Math.sin(f / 2)} />
          </g>
        )}
        <path d="M-50,10 Q-50,-60 0,-60 Q50,-60 50,10 Z" fill={alarm > 0 ? '#ff3a3a' : '#4a1a2a'} stroke="#fff" strokeOpacity=".4" strokeWidth={3} />
        <rect x={-64} y={8} width={128} height={22} rx={8} fill="#2a2a3a" />
      </g>
      {/* consola */}
      <path d="M-100,1560 L1180,1560 L1180,2100 L-100,2100 Z" fill="#090a18" />
      <path d="M-100,1470 L1180,1470 L1180,1580 L-100,1580 Z" fill="#141630" stroke={neon} strokeOpacity={0.6} strokeWidth={4} />
      {Array.from({ length: 9 }).map((_, i) => {
        const on = (Math.floor(f / 6) + i * 3) % 5 < 2 + buttons * 3;
        const c = [neon, '#ffc83d', '#ff4a5a', neon2][i % 4];
        return (
          <g key={i}>
            <circle cx={80 + i * 82} cy={1525} r={22} fill={c} opacity={on ? 0.95 : 0.25} />
            {on && <circle cx={80 + i * 82} cy={1525} r={34} fill={c} opacity={0.3} filter="url(#blur6)" />}
          </g>
        );
      })}
      {/* palanca */}
      <g transform="translate(900,1500)">
        <rect x={-70} y={-20} width={140} height={60} rx={18} fill="#1d2040" stroke={neon} strokeWidth={4} />
        <g transform={`rotate(${-40 + lever * 80})`}>
          <rect x={-10} y={-200} width={20} height={200} rx={10} fill="#b8c0d8" />
          <circle cx={0} cy={-210} r={34} fill={lever > 0.5 ? '#ff3a3a' : '#5ff0ff'} />
          <circle cx={-10} cy={-220} r={10} fill="#fff" opacity={0.5} />
        </g>
      </g>
      <Motes color={neon} n={24} speed={1.4} o={0.5} />
    </g>
  );
};

/** Operador del cerebro: técnico redondito con overol naranja y casco. (0,0) = pies. */
export const Operador: React.FC<{
  x: number; y: number; s?: number; armL?: number; armR?: number; jump?: number; look?: [number, number];
  eyes?: 'normal' | 'wide' | 'relief'; mug?: boolean; lean?: number; sweat?: number;
}> = ({ x, y, s = 1, armL = 20, armR = -20, jump = 0, look = [0, 0], eyes = 'normal', mug = false, lean = 0, sweat = 0 }) => {
  const f = useCurrentFrame();
  const ph = (f + 11) % 96;
  const bl = ph < 5 ? Math.abs(ph - 2.5) / 2.5 : 1;
  const er = eyes === 'wide' ? 30 : eyes === 'relief' ? 6 : 24;
  return (
    <g transform={`translate(${x},${y - jump * 120}) scale(${s}) rotate(${lean})`}>
      <ellipse cx={0} cy={4} rx={110} ry={18} fill="#000" opacity={0.4 * (1 - jump * 0.6)} />
      {/* piernas */}
      <rect x={-58} y={-90} width={44} height={90} rx={20} fill="#c24a0a" />
      <rect x={14} y={-90} width={44} height={90} rx={20} fill="#c24a0a" />
      <ellipse cx={-36} cy={-6} rx={36} ry={18} fill="#2a2a3a" />
      <ellipse cx={36} cy={-6} rx={36} ry={18} fill="#2a2a3a" />
      {/* brazos */}
      <g transform={`translate(-92,-230) rotate(${armL})`}>
        <rect x={-20} y={0} width={40} height={130} rx={20} fill="#e8661a" />
        <circle cx={0} cy={135} r={26} fill="#f4f0e8" />
        {mug && (
          <g transform="translate(0,150)">
            <rect x={-26} y={-10} width={52} height={60} rx={10} fill="#5ff0ff" />
            <path d="M26,5 q22,0 22,18 q0,18 -22,18" stroke="#5ff0ff" strokeWidth={8} fill="none" />
            <path d={`M-10,-20 q-8,-20 4,-40 M10,-20 q8,-20 -4,-40`} stroke="#fff" strokeOpacity={0.4 + 0.3 * Math.sin(f / 5)} strokeWidth={5} fill="none" />
          </g>
        )}
      </g>
      <g transform={`translate(92,-230) rotate(${armR})`}>
        <rect x={-20} y={0} width={40} height={130} rx={20} fill="#e8661a" />
        <circle cx={0} cy={135} r={26} fill="#f4f0e8" />
      </g>
      {/* cuerpo */}
      <ellipse cx={0} cy={-190} rx={105} ry={120} fill="#ff8a2a" stroke="#ffd0a0" strokeWidth={4} />
      <ellipse cx={-40} cy={-240} rx={34} ry={20} fill="#fff" opacity={0.2} />
      <rect x={-50} y={-200} width={100} height={70} rx={14} fill="#e8661a" />
      <circle cx={0} cy={-166} r={9} fill="#ffc83d" />
      {/* cabeza con casco */}
      <g transform="translate(0,-330)">
        <circle r={86} fill="#ffd9b8" stroke="#fff" strokeOpacity=".5" strokeWidth={3} />
        <path d="M-92,-6 Q-92,-104 0,-104 Q92,-104 92,-6 Z" fill="#ffe35a" stroke="#fff" strokeOpacity=".6" strokeWidth={3} />
        <rect x={-100} y={-14} width={200} height={20} rx={10} fill="#f0b800" />
        <ellipse cx={-30} cy={-70} rx={30} ry={14} fill="#fff" opacity={0.45} />
        {/* auriculares y micrófono */}
        <rect x={-104} y={-10} width={22} height={50} rx={10} fill="#2a2a3a" />
        <path d="M-94,36 Q-80,70 -30,64" stroke="#2a2a3a" strokeWidth={6} fill="none" />
        <circle cx={-28} cy={64} r={8} fill="#2a2a3a" />
        {/* ojos */}
        {[-30, 30].map((ex, i) => (
          <g key={i}>
            {eyes === 'relief' ? (
              <path d={`M${ex - 18},16 Q${ex},2 ${ex + 18},16`} stroke="#1a1030" strokeWidth={7} fill="none" strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx={ex} cy={14} rx={er * 0.85} ry={er * bl} fill="#fff" />
                {bl > 0.3 && <circle cx={ex + look[0] * 8} cy={14 + look[1] * 8} r={er * 0.45} fill="#1a1030" />}
                {bl > 0.3 && <circle cx={ex + look[0] * 8 - 4} cy={10 + look[1] * 8} r={4} fill="#fff" />}
              </>
            )}
          </g>
        ))}
        <ellipse cx={0} cy={50} rx={eyes === 'wide' ? 12 : 16} ry={eyes === 'wide' ? 14 : 5} fill="#7a2a2a" />
        {sweat > 0 && <path transform="translate(70,-10)" d="M0,-16 C8,-4 12,4 12,10 A12,12 0 0 1 -12,10 C-12,4 -8,-4 0,-16 Z" fill="#9fe8ff" opacity={sweat} />}
      </g>
    </g>
  );
};

/** Túnel neuronal para entrar al cerebro. p: 0-1 avance */
export const Tunel: React.FC<{ p: number; t?: number }> = ({ p, t = 0 }) => {
  const f = useCurrentFrame();
  const c1 = tone(t, '#4fb8ff', '#ff4a3a', '#5ff0ff');
  const c2 = '#c77dff';
  return (
    <g>
      <rect x={-200} y={-200} width={1480} height={2320} fill="#03050f" />
      <Halo x={540} y={960} r={500} color={c2} o={0.6} />
      {Array.from({ length: 18 }).map((_, i) => {
        const z = ((i / 18 + p * 1.6 + f * 0.004) % 1);
        const s = Math.pow(z, 2.4) * 3.2;
        return (
          <g key={i} transform={`translate(540,960) scale(${s}) rotate(${i * 23 + f})`} opacity={Math.min(1, z * 2) * (1 - z * 0.6)}>
            <ellipse rx={340} ry={500} fill="none" stroke={i % 2 ? c1 : c2} strokeWidth={6 / Math.max(0.3, s)} strokeDasharray="40 30" />
            {Array.from({ length: 6 }).map((_, k) => (
              <circle key={k} cx={Math.cos(k + i) * 340} cy={Math.sin(k + i) * 500} r={12} fill="#fff" opacity={0.8} />
            ))}
          </g>
        );
      })}
      {/* sinapsis que destellan */}
      {Array.from({ length: 30 }).map((_, i) => {
        const a = rnd(i) * Math.PI * 2;
        const d = ((rnd(i + 3) + p * 2 + f * 0.01) % 1);
        const r = Math.pow(d, 2) * 1200;
        return <line key={i} x1={540 + Math.cos(a) * r} y1={960 + Math.sin(a) * r} x2={540 + Math.cos(a) * r * 1.2} y2={960 + Math.sin(a) * r * 1.2}
          stroke={i % 2 ? c1 : '#fff'} strokeWidth={4} opacity={d} strokeLinecap="round" />;
      })}
    </g>
  );
};
