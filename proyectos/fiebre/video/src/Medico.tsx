import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Halo, Motes, rnd, mix, Sparkle, lin } from './common';

/** Músculos que se contraen como motores, con pulsos rojos. heat: aura de calor 0-1 */
export const Musculos: React.FC<{ heat: number }> = ({ heat }) => {
  const f = useCurrentFrame();
  const bundles = [
    { x: 540, y: 1080, len: 620, th: 170, rot: -28, ph: 0 },
    { x: 400, y: 1380, len: 480, th: 130, rot: -20, ph: 1.3 },
    { x: 690, y: 820, len: 420, th: 110, rot: -36, ph: 2.4 },
  ];
  return (
    <g>
      <defs>
        <radialGradient id="mbg" cx="50%" cy="50%" r="70%"><stop offset="0" stopColor={mix('#3a1466', '#6a0e1e', heat)} /><stop offset="1" stopColor="#0c0418" /></radialGradient>
        <linearGradient id="fiber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a8a" /><stop offset=".5" stopColor="#e8304a" /><stop offset="1" stopColor="#7a0a2a" />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2520} fill="url(#mbg)" />
      {/* silueta del brazo, translúcida */}
      <path d="M-120,1820 C120,1560 260,1300 420,1060 C560,850 720,640 940,520 C1020,480 1120,520 1180,600 L1180,900 C1000,900 860,1040 760,1220 C640,1430 480,1680 300,1980 Z"
        fill="#2a7af0" opacity={0.18} stroke="#7fdcff" strokeWidth={6} strokeOpacity={0.7} />
      <Halo x={540} y={1080} r={600} color="#ff3a2a" o={0.25 + heat * 0.5} />
      {bundles.map((b, i) => {
        const c = Math.pow(0.5 + 0.5 * Math.sin(f * 0.95 + b.ph), 2);
        const sx = 1 - 0.14 * c, sy = 1 + 0.22 * c;
        return (
          <g key={i} transform={`translate(${b.x},${b.y}) rotate(${b.rot})`}>
            <ellipse rx={b.len / 2 + 30} ry={b.th / 2 + 30} fill="#ff2a3a" opacity={0.18 + c * 0.35} filter="url(#blur20)" />
            <g transform={`scale(${sx},${sy})`}>
              <path d={`M${-b.len / 2},0 C${-b.len / 3},${-b.th / 2} ${b.len / 3},${-b.th / 2} ${b.len / 2},0 C${b.len / 3},${b.th / 2} ${-b.len / 3},${b.th / 2} ${-b.len / 2},0 Z`}
                fill="url(#fiber)" stroke="#ffd0c8" strokeWidth={4} />
              {Array.from({ length: 7 }).map((_, k) => {
                const yy = -b.th * 0.36 + k * (b.th * 0.12);
                return <path key={k} d={`M${-b.len * 0.42},${yy * 0.5} Q0,${yy * 1.15} ${b.len * 0.42},${yy * 0.5}`} stroke="#ffe0d8" strokeOpacity={0.35} strokeWidth={3} fill="none" />;
              })}
              <ellipse cx={-b.len * 0.1} cy={-b.th * 0.22} rx={b.len * 0.22} ry={b.th * 0.08} fill="#fff" opacity={0.3} />
            </g>
            {/* tendones */}
            <rect x={-b.len / 2 - 70 + c * 20} y={-10} width={80} height={20} rx={10} fill="#f0e0d8" opacity={0.8} />
            <rect x={b.len / 2 - 10 - c * 20} y={-10} width={80} height={20} rx={10} fill="#f0e0d8" opacity={0.8} />
            {/* pulso de energía en cada contracción */}
            {[0, 1, 2].map((k) => {
              const ph = ((f * 0.95 + b.ph) / (Math.PI * 2) + k / 3) % 1;
              return <ellipse key={k} rx={b.len * (0.3 + ph * 0.6)} ry={b.th * (0.4 + ph * 1.2)} fill="none" stroke="#ff5a3a" strokeWidth={8 * (1 - ph)} opacity={(1 - ph) * 0.8} />;
            })}
          </g>
        );
      })}
      {/* chispas de calor */}
      {Array.from({ length: 34 }).map((_, i) => {
        const life = ((f * 1.8 + rnd(i) * 60) % 60) / 60;
        const a = rnd(i + 2) * Math.PI * 2;
        const d = 80 + life * 420;
        const bx = bundles[i % 3].x, by = bundles[i % 3].y;
        return <Sparkle key={i} x={bx + Math.cos(a) * d} y={by + Math.sin(a) * d - life * 120} s={0.6 + rnd(i + 4)} color={i % 2 ? '#ffc83d' : '#ff6a3a'} o={(1 - life) * 0.9} />;
      })}
      {/* engranajes-motor en las articulaciones */}
      {[[290, 1650, 1], [880, 600, -1]].map(([gx, gy, dir], i) => (
        <g key={i} transform={`translate(${gx},${gy}) rotate(${f * 18 * dir})`} opacity={0.85}>
          {Array.from({ length: 8 }).map((_, k) => <rect key={k} transform={`rotate(${k * 45})`} x={-14} y={-78} width={28} height={30} rx={6} fill="#ffc83d" />)}
          <circle r={56} fill="#ffc83d" stroke="#fff3c0" strokeWidth={4} />
          <circle r={20} fill="#3a1466" />
        </g>
      ))}
      <Motes color="#ff8a5a" n={30} speed={2} o={0.6} />
    </g>
  );
};

/**
 * Vasos sanguíneos bajo la piel de la mano que se estrechan (vasoconstricción).
 * k: 0 = abiertos, 1 = estrechos; el calor se retira hacia la muñeca y los dedos se enfrían.
 */
export const Vasos: React.FC<{ k: number }> = ({ k }) => {
  const f = useCurrentFrame();
  const fingers = [
    { tip: [300, 640], base: [400, 1060] },
    { tip: [450, 520], base: [480, 1000] },
    { tip: [610, 520], base: [580, 1000] },
    { tip: [760, 620], base: [670, 1040] },
    { tip: [900, 1000], base: [740, 1200] },
  ];
  const wrist = [540, 1820];
  const paths = fingers.map((g) => `M${wrist[0]},${wrist[1]} C${wrist[0]},1500 ${g.base[0]},1300 ${g.base[0]},${g.base[1]} S${g.tip[0]},${g.tip[1] + 180} ${g.tip[0]},${g.tip[1] + 30}`);
  const w = 26 - 18 * k;
  return (
    <g>
      <defs>
        <radialGradient id="vbg" cx="50%" cy="70%" r="80%"><stop offset="0" stopColor="#4a1740" /><stop offset="1" stopColor="#0a0418" /></radialGradient>
        <linearGradient id="skinHand" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff6a4a" stopOpacity=".45" />
          <stop offset={0.75 - k * 0.45} stopColor={mix('#ff6a4a', '#2a7af0', k)} stopOpacity=".35" />
          <stop offset="1" stopColor={mix('#ff8a6a', '#bfefff', k)} stopOpacity=".45" />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2520} fill="url(#vbg)" />
      {/* mano translúcida */}
      <g fill="url(#skinHand)" stroke={mix('#ffc0a0', '#bfefff', k)} strokeWidth={6}>
        {fingers.map((g, i) => (
          <path key={i} d={`M${g.base[0]},${g.base[1]} L${g.tip[0]},${g.tip[1] + 30}`} strokeLinecap="round" strokeWidth={i === 4 ? 120 : 130} stroke={mix('#ffc0a0', '#bfefff', k)} strokeOpacity={0.5} />
        ))}
        <path d="M300,1000 Q300,900 420,920 L760,960 Q860,1000 840,1200 L760,1500 L700,1950 L380,1950 L330,1500 Z" />
      </g>
      {fingers.map((g, i) => <line key={'f' + i} x1={g.base[0]} y1={g.base[1]} x2={g.tip[0]} y2={g.tip[1] + 30} stroke={mix('#ff8a6a', '#5fb8ff', k)} strokeOpacity={0.35} strokeWidth={110} strokeLinecap="round" />)}
      {/* calor que se concentra en la muñeca */}
      <Halo x={540} y={1750} r={420 + k * 60} color="#ff3a1a" o={0.6 + k * 0.3} />
      {/* vasos */}
      {paths.map((d, i) => (
        <g key={i} fill="none" strokeLinecap="round">
          <path d={d} stroke="#ff2a3a" strokeWidth={w + 18} opacity={0.25 * (1 - k * 0.6)} filter="url(#blur6)" />
          <path d={d} stroke={mix('#ff3a4a', '#7a1a3a', k)} strokeWidth={w} />
          <path d={d} stroke="#ffb0a0" strokeWidth={Math.max(2, w * 0.3)} opacity={0.6} />
          {/* glóbulos que fluyen (cada vez menos y más lentos) */}
          <path d={d} stroke="#ffe0d8" strokeWidth={Math.max(3, w * 0.5)} strokeDasharray={`4 ${40 + k * 140}`} strokeDashoffset={-f * (14 - k * 11) - i * 20} opacity={1 - k * 0.7} />
        </g>
      ))}
      {/* capilares laterales que se apagan */}
      {Array.from({ length: 16 }).map((_, i) => {
        const g = fingers[i % 5];
        const tt = 0.3 + rnd(i) * 0.6;
        const x = g.base[0] + (g.tip[0] - g.base[0]) * tt, y = g.base[1] + (g.tip[1] - g.base[1]) * tt;
        return <path key={i} d={`M${x},${y} q${(rnd(i + 1) - 0.5) * 80},-30 ${(rnd(i + 2) - 0.5) * 120},-60`} stroke="#ff4a5a" strokeWidth={6} opacity={lin(k, [0, 0.5], [0.7, 0])} fill="none" strokeLinecap="round" />;
      })}
      {/* escarcha en las yemas */}
      {fingers.map((g, i) => [0, 1, 2].map((j) => (
        <Sparkle key={i + '-' + j} x={g.tip[0] + (j - 1) * 38} y={g.tip[1] + 20 + Math.sin(f / 5 + j + i) * 10 + j * 20} s={0.8 + 0.3 * Math.sin(f / 4 + i + j)} color="#e8fbff" o={lin(k, [0.3, 0.9], [0, 1])} />
      )))}
      {fingers.map((g, i) => <Halo key={'h' + i} x={g.tip[0]} y={g.tip[1] + 40} r={110} color="#7fdcff" o={k * 0.7} />)}
      <Motes color={mix('#ff8a6a', '#bfefff', k)} n={20} o={0.5} />
    </g>
  );
};
