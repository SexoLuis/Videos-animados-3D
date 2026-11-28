import React from 'react';
import { useCurrentFrame } from 'remotion';
import { mix, rnd, Sparkle } from './common';

/** Paleta de la silueta luminosa según el calor (0 = frío azul, 1 = fiebre roja) */
export const piel = (heat: number, icy = 0) => {
  const top = mix(mix('#2a7af0', '#ff7a3a', heat), '#bfefff', icy);
  const bot = mix(mix('#0c3a8c', '#a8141e', heat), '#4fa8e8', icy);
  const edge = mix(mix('#7fdcff', '#ffc08a', heat), '#e8fbff', icy);
  return { top, bot, edge };
};

const Grad: React.FC<{ id: string; heat: number; icy?: number }> = ({ id, heat, icy = 0 }) => {
  const p = piel(heat, icy);
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={p.top} />
      <stop offset="1" stopColor={p.bot} />
    </linearGradient>
  );
};

export type Mouth = 'chatter' | 'frown' | 'o' | 'pant' | 'flat' | 'smile' | 'grimace';
export type Brow = 'worried' | 'surprised' | 'tired' | 'neutral' | 'panic';

export interface HeadProps {
  heat?: number; core?: number; look?: [number, number]; open?: number; brow?: Brow; mouth?: Mouth;
  gorroTilt?: number; gorroOff?: number; messy?: number; sweat?: number; frost?: number; blink?: boolean; uid?: string;
}

/** Cabeza del personaje, centrada en (0,0). Mira a cámara. Nunca "habla". */
export const Head: React.FC<HeadProps> = ({
  heat = 0, core = 0, look = [0, 0], open = 1, brow = 'neutral', mouth = 'flat',
  gorroTilt = 0, gorroOff = 0, messy = 0, sweat = 0, frost = 0, blink = true, uid = 'a',
}) => {
  const f = useCurrentFrame();
  const p = piel(heat);
  const gid = 'head' + uid;
  // parpadeo cada ~100 fotogramas
  const ph = (f + 37) % 100;
  const bl = blink && ph < 5 ? Math.abs(ph - 2.5) / 2.5 : 1;
  const ry = 42 * Math.max(0.08, open * bl);
  const browY = -66;
  const browDef: Record<Brow, [number, number]> = { neutral: [0, 0], worried: [-16, 8], surprised: [0, -16], tired: [10, 10], panic: [-22, -12] };
  const [ang, by] = browDef[brow];
  const chat = Math.sin(f * 2.2) > 0 ? 1 : 0;
  return (
    <g>
      <defs>
        <Grad id={gid} heat={heat} />
        <clipPath id={'clip' + uid}><ellipse cx={0} cy={0} rx={125} ry={135} /></clipPath>
        <radialGradient id={'core' + uid} cx="50%" cy="55%" r="55%">
          <stop offset="0" stopColor="#ff5a2a" stopOpacity=".9" />
          <stop offset="1" stopColor="#ff2a1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* halo exterior */}
      <ellipse cx={0} cy={0} rx={150} ry={160} fill={p.edge} opacity={0.18} filter="url(#blur20)" />
      <ellipse cx={0} cy={0} rx={125} ry={135} fill={`url(#${gid})`} stroke={p.edge} strokeWidth={5} />
      <g clipPath={`url(#clip${uid})`}>
        {core > 0 && <ellipse cx={0} cy={40} rx={140} ry={150} fill={`url(#core${uid})`} opacity={core} />}
        {/* líneas de escáner */}
        {Array.from({ length: 14 }).map((_, i) => {
          const y = -140 + ((i * 22 + f * 1.5) % 300);
          return <rect key={i} x={-130} y={y} width={260} height={2} fill="#fff" opacity={0.08} />;
        })}
        <ellipse cx={-45} cy={-80} rx={50} ry={26} fill="#fff" opacity={0.18} />
      </g>
      {/* mejillas sonrosadas por la fiebre */}
      <ellipse cx={-82} cy={42} rx={26} ry={14} fill="#ff6a8a" opacity={0.25 + heat * 0.35} filter="url(#blur6)" />
      <ellipse cx={82} cy={42} rx={26} ry={14} fill="#ff6a8a" opacity={0.25 + heat * 0.35} filter="url(#blur6)" />
      {/* ojos */}
      {[-50, 50].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy={-8} rx={36} ry={ry} fill="#fff" />
          {ry > 10 && (
            <>
              <circle cx={x + look[0] * 14} cy={-8 + look[1] * 14} r={Math.min(17, ry * 0.5)} fill="#10122a" />
              <circle cx={x + look[0] * 14 - 6} cy={-8 + look[1] * 14 - 7} r={5} fill="#fff" />
            </>
          )}
          {/* párpado de cansancio */}
          {open < 0.99 && ry > 10 && <ellipse cx={x} cy={-8 - ry * 0.9} rx={38} ry={ry * 0.6} fill={p.top} />}
          <line x1={x - 30} x2={x + 30} y1={browY + by + (i ? -1 : 1) * Math.sin((ang * Math.PI) / 180) * 30}
            y2={browY + by - (i ? -1 : 1) * Math.sin((ang * Math.PI) / 180) * 30}
            stroke="#d8f4ff" strokeWidth={10} strokeLinecap="round" opacity={0.9} />
        </g>
      ))}
      {/* nariz roja brillante */}
      <circle cx={0} cy={38} r={40} fill="#ff3030" opacity={0.35} filter="url(#blur6)" />
      <circle cx={0} cy={38} r={27} fill="url(#nose)" />
      <ellipse cx={-8} cy={28} rx={8} ry={5} fill="#fff" opacity={0.7} />
      {/* boca */}
      <g transform="translate(0,92)">
        {mouth === 'chatter' && (
          <g>
            <rect x={-44} y={-16} width={88} height={34} rx={12} fill="#1a0b2a" stroke="#bfefff" strokeWidth={3} />
            <rect x={-40} y={-14 + chat * 3} width={80} height={13} rx={4} fill="#f4fbff" />
            <rect x={-40} y={2 - chat * 3} width={80} height={13} rx={4} fill="#e4f2ff" />
            {[-20, 0, 20].map((x) => <line key={x} x1={x} x2={x} y1={-14} y2={15} stroke="#9fb8d8" strokeWidth={2} />)}
          </g>
        )}
        {mouth === 'grimace' && (
          <g>
            <rect x={-40} y={-12} width={80} height={26} rx={10} fill="#f4fbff" stroke="#bfefff" strokeWidth={3} />
            <line x1={-40} x2={40} y1={1} y2={1} stroke="#9fb8d8" strokeWidth={2} />
          </g>
        )}
        {mouth === 'frown' && <path d="M-36,10 Q-18,-8 0,6 Q18,-8 36,10" fill="none" stroke="#d8f4ff" strokeWidth={8} strokeLinecap="round" />}
        {mouth === 'flat' && <path d="M-28,4 L28,4" fill="none" stroke="#d8f4ff" strokeWidth={8} strokeLinecap="round" />}
        {mouth === 'smile' && <path d="M-30,-2 Q0,22 30,-2" fill="none" stroke="#d8f4ff" strokeWidth={8} strokeLinecap="round" />}
        {mouth === 'o' && <ellipse cx={0} cy={4} rx={15} ry={19} fill="#1a0b2a" stroke="#d8f4ff" strokeWidth={4} />}
        {mouth === 'pant' && (
          <g>
            <path d="M-38,-6 Q0,-14 38,-6 Q30,34 0,36 Q-30,34 -38,-6 Z" fill="#2a0a16" stroke="#ffd8c8" strokeWidth={4} />
            <ellipse cx={4} cy={24} rx={18} ry={12} fill="#ff6a7a" />
          </g>
        )}
      </g>
      {/* escarcha */}
      {frost > 0 && [[-110, -40], [100, 10], [-60, 110], [80, -100], [118, 70]].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} s={0.6 + 0.4 * Math.sin(f / 6 + i)} color="#e8fbff" o={frost} />
      ))}
      {/* sudor en la frente */}
      {sweat > 0 && [[-96, -50], [92, -30], [-30, -100], [60, -96], [-110, 40]].map(([x, y], i) => {
        const yy = y + ((f * 1.6 + i * 40) % 90);
        return <path key={i} transform={`translate(${x},${yy}) scale(${0.8 + rnd(i) * 0.5})`} opacity={sweat}
          d="M0,-16 C8,-4 12,4 12,10 A12,12 0 0 1 -12,10 C-12,4 -8,-4 0,-16 Z" fill="#9fe8ff" stroke="#e8fbff" strokeWidth={2} />;
      })}
      {/* gorro de lana con pompón rojo */}
      <g transform={`translate(0,${-gorroOff}) rotate(${gorroTilt},0,-70)`}>
        {messy > 0 && [-110, -80, 70, 100, 118].map((x, i) => (
          <path key={i} d={`M${x},-60 q${(i % 2 ? 1 : -1) * 22 * messy},${-30 * messy} ${(i % 2 ? 1 : -1) * 40 * messy},${-20 * messy}`}
            stroke="#5a3a2a" strokeWidth={10} strokeLinecap="round" fill="none" />
        ))}
        <path d="M-128,-62 C-128,-190 128,-190 128,-62 Z" fill="url(#knit)" />
        {[-80, -40, 0, 40, 80].map((x) => <path key={x} d={`M${x},-70 Q${x * 0.85},-130 ${x * 0.6},-165`} stroke="#3a3f4e" strokeWidth={3} fill="none" opacity={0.6} />)}
        <rect x={-136} y={-82} width={272} height={44} rx={20} fill="#6b7386" />
        {Array.from({ length: 13 }).map((_, i) => <line key={i} x1={-120 + i * 20} x2={-120 + i * 20} y1={-78} y2={-42} stroke="#4c5263" strokeWidth={5} />)}
        <circle cx={0} cy={-190} r={40} fill="url(#pompom)" />
        <circle cx={-12} cy={-202} r={12} fill="#fff" opacity={0.35} />
      </g>
    </g>
  );
};

/** Mano tipo silueta luminosa; (0,0) = centro de la palma, los dedos apuntan hacia -y */
export const Hand: React.FC<{ x: number; y: number; r?: number; s?: number; heat?: number; icy?: number; uid: string; flip?: boolean }> = ({ x, y, r = 0, s = 1, heat = 0, icy = 0, uid, flip }) => {
  const p = piel(heat, icy);
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${flip ? -s : s},${s})`}>
      <defs><Grad id={'hand' + uid} heat={heat} icy={icy} /></defs>
      <g fill={`url(#hand${uid})`} stroke={p.edge} strokeWidth={4}>
        {[-33, -11, 11, 33].map((fx, i) => <rect key={i} x={fx - 10} y={-78 + Math.abs(fx) * 0.4} width={21} height={62} rx={10.5} />)}
        <rect x={-62} y={-30} width={22} height={50} rx={11} transform="rotate(-35,-50,0)" />
        <ellipse cx={0} cy={0} rx={48} ry={44} />
      </g>
      {icy > 0 && [[-30, -60], [20, -70], [0, 10], [36, -20]].map(([sx, sy], i) => <Sparkle key={i} x={sx} y={sy} s={0.7} color="#ffffff" o={icy} />)}
    </g>
  );
};

/** Brazo: trazo grueso con borde luminoso desde el hombro hasta la mano */
export const Arm: React.FC<{ d: string; heat?: number; w?: number }> = ({ d, heat = 0, w = 64 }) => {
  const p = piel(heat);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={p.edge} strokeWidth={w + 8} />
      <path d={d} stroke={p.bot} strokeWidth={w} />
      <path d={d} stroke={p.top} strokeWidth={w * 0.45} opacity={0.6} />
    </g>
  );
};

/** Torso sentado: hombros en y=0, ancho 300 */
export const Torso: React.FC<{ heat?: number; core?: number; uid: string }> = ({ heat = 0, core = 0, uid }) => {
  const p = piel(heat);
  const f = useCurrentFrame();
  return (
    <g>
      <defs>
        <Grad id={'torso' + uid} heat={heat} />
        <radialGradient id={'tcore' + uid}>
          <stop offset="0" stopColor="#ff5020" stopOpacity="1" />
          <stop offset=".5" stopColor="#ff2a10" stopOpacity=".5" />
          <stop offset="1" stopColor="#ff2a10" stopOpacity="0" />
        </radialGradient>
        <clipPath id={'tclip' + uid}><path d="M-150,30 Q-150,-10 -100,-10 L100,-10 Q150,-10 150,30 L190,520 L-190,520 Z" /></clipPath>
      </defs>
      <path d="M-150,30 Q-150,-10 -100,-10 L100,-10 Q150,-10 150,30 L190,520 L-190,520 Z" fill={`url(#torso${uid})`} stroke={p.edge} strokeWidth={5} />
      <g clipPath={`url(#tclip${uid})`}>
        {core > 0 && <ellipse cx={0} cy={200} rx={220 + Math.sin(f / 5) * 10} ry={240} fill={`url(#tcore${uid})`} opacity={core} />}
        {Array.from({ length: 22 }).map((_, i) => (
          <rect key={i} x={-200} y={-10 + ((i * 26 + f * 1.5) % 560)} width={400} height={2} fill="#fff" opacity={0.07} />
        ))}
      </g>
      <rect x={-40} y={-30} width={80} height={40} rx={20} fill={p.bot} />
    </g>
  );
};

/** Pie (planta hacia cámara) */
export const Foot: React.FC<{ x: number; y: number; r?: number; heat?: number; icy?: number; uid: string }> = ({ x, y, r = 0, heat = 0, icy = 0, uid }) => {
  const p = piel(heat, icy);
  return (
    <g transform={`translate(${x},${y}) rotate(${r})`}>
      <defs><Grad id={'foot' + uid} heat={heat} icy={icy} /></defs>
      <ellipse cx={0} cy={0} rx={52} ry={70} fill={`url(#foot${uid})`} stroke={p.edge} strokeWidth={4} />
      {[-30, -12, 6, 22, 36].map((tx, i) => <circle key={i} cx={tx} cy={-68 + Math.abs(tx) * 0.3} r={11 - i * 0.8} fill={`url(#foot${uid})`} stroke={p.edge} strokeWidth={3} />)}
      {icy > 0 && [[-20, -20], [24, 10], [0, 40]].map(([sx, sy], i) => <Sparkle key={i} x={sx} y={sy} s={0.8} color="#fff" o={icy} />)}
    </g>
  );
};
