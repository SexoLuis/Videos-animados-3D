/**
 * El barbudo: personaje principal del estilo. Caricatura plana con contorno grueso.
 * <Cabeza> está centrada en (0,0) (cara ≈ 300×345). <Cuerpo> tiene los hombros en (0,0).
 * Nunca mueve la boca como si hablara: las bocas son expresiones fijas.
 */
import React, { useId } from 'react';
import { useCurrentFrame } from 'remotion';
import { INK, SW, Gota } from './base';

export const PIEL = '#f1b38a', PIEL_S = '#dc9670', PELO = '#1d191a', ROJO = '#ed5446', ROJO_S = '#d4443a', CACHETE = '#f0857f';

export type Boca = 'sonrisa' | 'grande' | 'dientes' | 'abierta' | 'o' | 'ondulada' | 'plana' | 'bostezo' | 'culpable' | 'mastica' | 'triste';
export type Cejas = 'normal' | 'arriba' | 'enojo' | 'preocupado' | 'cansado' | 'picaro';

export interface CabezaProps {
  boca?: Boca; cejas?: Cejas; mira?: [number, number]; parpado?: number; ojoGuino?: boolean; parpadea?: boolean;
  sudor?: number; rubor?: number; dormido?: boolean; mejillasLlenas?: number; color?: string;
}

const ojo = (x: number, mira: [number, number], parpado: number, bl: number, cerrado: boolean) => {
  const ry = 44;
  if (cerrado || bl < 0.15) return <path key={x} d={`M${x - 34},-26 Q${x},-6 ${x + 34},-26`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />;
  return (
    <g key={x}>
      <ellipse cx={x} cy={-30} rx={38} ry={ry * bl} fill="#fff" stroke={INK} strokeWidth={SW} />
      <circle cx={x + mira[0] * 14} cy={-30 + mira[1] * 14 * bl} r={19 * Math.min(1, bl + 0.2)} fill="#6b3a20" stroke={INK} strokeWidth={3} />
      <circle cx={x + mira[0] * 14} cy={-30 + mira[1] * 14 * bl} r={11 * Math.min(1, bl + 0.2)} fill={INK} />
      <circle cx={x + mira[0] * 14 - 6} cy={-30 + mira[1] * 14 * bl - 7} r={6} fill="#fff" />
      <circle cx={x + mira[0] * 14 + 7} cy={-30 + mira[1] * 14 * bl + 6} r={2.5} fill="#fff" />
      {parpado > 0.02 && (
        <path d={`M${x - 42},-30 L${x - 42},${-30 - ry - 4} L${x + 42},${-30 - ry - 4} L${x + 42},-30 L${x + 40},${-30 - ry + parpado * ry * 1.4} Q${x},${-30 - ry + parpado * ry * 1.4 + 8} ${x - 40},${-30 - ry + parpado * ry * 1.4} Z`}
          fill={PIEL} />
      )}
      {parpado > 0.02 && <path d={`M${x - 40},${-30 - ry + parpado * ry * 1.4} Q${x},${-30 - ry + parpado * ry * 1.4 + 8} ${x + 40},${-30 - ry + parpado * ry * 1.4}`} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />}
    </g>
  );
};

const CEJAS: Record<Cejas, [number, number, number, number]> = {
  // [inclinación izq, inclinación der, altura izq, altura der]
  normal: [0, 0, 0, 0], arriba: [-6, 6, -16, -16], enojo: [18, -18, 6, 6], preocupado: [-16, 16, -4, -4], cansado: [8, -8, 8, 8], picaro: [0, 16, -14, 4],
};

export const Cabeza: React.FC<CabezaProps> = ({ boca = 'sonrisa', cejas = 'normal', mira = [0, 0], parpado = 0, ojoGuino = false, parpadea = true,
  sudor = 0, rubor = 0, dormido = false, mejillasLlenas = 0, color = PIEL }) => {
  const f = useCurrentFrame();
  const uid = 'c' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const ph = (f + 23) % 105;
  const bl = parpadea && !dormido && ph < 6 ? Math.abs(ph - 3) / 3 : 1;
  const [ai, ad, hi, hd] = CEJAS[cejas];
  const ch = Math.sin(f * 2.4) > 0 ? 1 : 0;
  const mast = Math.abs(Math.sin(f / 3));
  // picos del pelo detrás de la cabeza
  const picos: string[] = [];
  for (let k = 0; k <= 14; k++) {
    const a = Math.PI * (1.08 + (k / 14) * 0.84);
    const r = k % 2 ? 175 : 228;
    picos.push(`${Math.cos(a) * r * 1.02},${Math.sin(a) * r * 1.05 - 20}`);
  }
  return (
    <g>
      <polygon points={`-150,40 ${picos.join(' ')} 150,40`} fill={PELO} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {picos.filter((_, k) => k % 2 === 0 && k > 0 && k < 14).map((pt, k) => {
        const [px, py] = pt.split(',').map(Number);
        return <path key={k} d={`M${px * 0.62},${py * 0.62 - 6} Q${px * 0.78},${py * 0.8} ${px * 0.88},${py * 0.9}`} fill="none" stroke="#4a4246" strokeWidth={6} strokeLinecap="round" />;
      })}
      {/* orejas */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * 148} cy={0} r={36} fill={color} stroke={INK} strokeWidth={SW} />
          <circle cx={s * 152} cy={4} r={18} fill={PIEL_S} opacity={0.6} />
          <path d={`M${s * 140},-14 Q${s * 160},0 ${s * 140},16`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      {/* cara */}
      <defs><clipPath id={uid}><ellipse cx={0} cy={0} rx={150 + mejillasLlenas * 22} ry={172} /></clipPath></defs>
      <ellipse cx={0} cy={0} rx={150 + mejillasLlenas * 22} ry={172} fill={color} />
      <g clipPath={`url(#${uid})`}>
        <ellipse cx={205} cy={20} rx={120} ry={220} fill={PIEL_S} opacity={0.55} />
        <ellipse cx={-60} cy={-112} rx={60} ry={26} fill="#fff" opacity={0.22} />
        <ellipse cx={0} cy={180} rx={170} ry={60} fill={PIEL_S} opacity={0.5} />
      </g>
      <ellipse cx={0} cy={0} rx={150 + mejillasLlenas * 22} ry={172} fill="none" stroke={INK} strokeWidth={SW} />
      {/* entradas del pelo en la frente */}
      <path d="M-146,-70 Q-140,-176 0,-180 Q140,-176 146,-70 Q126,-112 86,-116 Q50,-118 30,-96 L0,-66 L-30,-96 Q-50,-118 -86,-116 Q-126,-112 -146,-70 Z" fill={PELO} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {/* cachetes */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={s * (88 + mejillasLlenas * 10)} cy={34} rx={30 + mejillasLlenas * 8} ry={20} fill={CACHETE} opacity={0.85 + rubor * 0.15} />
          <line x1={s * 96 - 10} y1={24} x2={s * 96 - 2} y2={16} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          <line x1={s * 96 + 4} y1={26} x2={s * 96 + 12} y2={18} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {/* ojos y cejas */}
      {ojo(-56, mira, parpado, bl, dormido)}
      {ojoGuino ? <path d="M22,-28 Q56,-44 90,-28" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" /> : ojo(56, mira, parpado, bl, dormido)}
      <rect x={-92} y={-102 + hi} width={72} height={18} rx={9} fill={PELO} transform={`rotate(${ai},-56,${-93 + hi})`} />
      <rect x={20} y={-102 + hd} width={72} height={18} rx={9} fill={PELO} transform={`rotate(${ad},56,${-93 + hd})`} />
      {/* nariz */}
      <path d="M-18,14 Q-24,42 0,46 Q24,42 18,14" fill={PIEL_S} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      {/* barba con hueco para la boca */}
      <path d="M-152,10 Q-146,170 -58,212 Q0,238 58,212 Q146,170 152,10 Q128,70 96,74 Q60,60 0,62 Q-60,60 -96,74 Q-128,70 -152,10 Z" fill={PELO} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse cx={0} cy={112} rx={58} ry={38} fill={color} stroke={INK} strokeWidth={5} />
      {/* bigote */}
      <path d="M-70,70 Q-36,52 0,66 Q36,52 70,70 Q40,88 0,78 Q-40,88 -70,70 Z" fill={PELO} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {[[-118, 60], [-96, 120], [-60, 168], [0, 196], [60, 168], [96, 120], [118, 60], [-30, 150], [30, 150]].map(([bx, by], i) => (
        <path key={i} d={`M${bx - 10},${by} q10,-12 20,0`} fill="none" stroke="#4a4246" strokeWidth={4} strokeLinecap="round" />
      ))}
      {(parpado > 0.3 || cejas === 'cansado') && [-56, 56].map((x) => <path key={x} d={`M${x - 26},20 Q${x},32 ${x + 26},20`} fill="none" stroke={PIEL_S} strokeWidth={6} strokeLinecap="round" />)}
      {/* boca */}
      <g transform="translate(0,112)">
        {boca === 'sonrisa' && <path d="M-30,-6 Q0,20 30,-6" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {boca === 'grande' && <path d="M-36,-12 Q0,34 36,-12 Z" fill="#7a2030" stroke={INK} strokeWidth={6} strokeLinejoin="round" />}
        {boca === 'culpable' && <path d="M-34,-4 Q-10,8 6,0 Q22,-8 34,-14" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {boca === 'plana' && <path d="M-26,0 L26,0" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {boca === 'triste' && <path d="M-28,10 Q0,-12 28,10" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {boca === 'ondulada' && <path d="M-34,4 Q-22,-8 -10,4 Q2,14 12,2 Q22,-10 34,4" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
        {boca === 'o' && <ellipse cx={0} cy={2} rx={15} ry={20} fill="#7a2030" stroke={INK} strokeWidth={6} />}
        {boca === 'abierta' && <g><ellipse cx={0} cy={4} rx={36} ry={26} fill="#7a2030" stroke={INK} strokeWidth={6} /><ellipse cx={0} cy={18} rx={18} ry={9} fill="#f07080" /></g>}
        {boca === 'bostezo' && <g><ellipse cx={0} cy={4} rx={34} ry={34} fill="#5a1424" stroke={INK} strokeWidth={6} /><ellipse cx={0} cy={22} rx={18} ry={9} fill="#f07080" /></g>}
        {boca === 'mastica' && <path d={`M-30,${-2 + mast * 4} Q0,${12 - mast * 8} 30,${-2 + mast * 4}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {boca === 'dientes' && (
          <g>
            <rect x={-40} y={-16} width={80} height={36} rx={10} fill="#fff" stroke={INK} strokeWidth={6} />
            <line x1={-40} x2={40} y1={2 + ch * 2} y2={2 + ch * 2} stroke={INK} strokeWidth={4} />
            {[-20, 0, 20].map((x) => <line key={x} x1={x} x2={x} y1={-16} y2={20} stroke={INK} strokeWidth={4} />)}
          </g>
        )}
      </g>
      {sudor > 0 && [[-120, -60], [128, -40], [-100, 40]].map(([x, y], i) => (
        <Gota key={i} x={x} y={y + ((f * 1.4 + i * 30) % 60)} s={0.9} o={sudor} />
      ))}
    </g>
  );
};

/** Brazo de 2 segmentos: manga roja hasta el codo, antebrazo de piel, mano. */
export const Brazo: React.FC<{ s: [number, number]; e: [number, number]; m: [number, number]; mano?: 'abierta' | 'puño' | 'señala'; manoRot?: number }> = ({ s, e, m, mano = 'abierta', manoRot = 0 }) => (
  <g strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d={`M${s[0]},${s[1]} L${e[0]},${e[1]} L${m[0]},${m[1]}`} stroke={INK} strokeWidth={62 + SW * 2} />
    <path d={`M${e[0]},${e[1]} L${m[0]},${m[1]}`} stroke={PIEL} strokeWidth={50} />
    <path d={`M${s[0]},${s[1]} L${(s[0] + e[0] * 2) / 3},${(s[1] + e[1] * 2) / 3}`} stroke={ROJO} strokeWidth={62} />
    <path d={`M${(s[0] + e[0] * 2) / 3},${(s[1] + e[1] * 2) / 3} L${(s[0] * 0.3 + e[0] * 2.7) / 3},${(s[1] * 0.3 + e[1] * 2.7) / 3}`} stroke={ROJO_S} strokeWidth={66} strokeLinecap="butt" />
    <g transform={`translate(${m[0]},${m[1]}) rotate(${manoRot})`}>
      {mano === 'señala' && <rect x={-9} y={-78} width={20} height={60} rx={10} fill={PIEL} stroke={INK} strokeWidth={SW} />}
      <circle r={36} fill={PIEL} stroke={INK} strokeWidth={SW} />
      {mano === 'abierta' && [-24, -8, 8, 24].map((x) => <g key={x}><rect x={x - 8} y={-58} width={17} height={34} rx={8.5} fill={PIEL} stroke={INK} strokeWidth={5} /><rect x={x - 4} y={-54} width={9} height={8} rx={3} fill="#fbd5c0" /></g>)}
      <ellipse cx={10} cy={10} rx={18} ry={14} fill={PIEL_S} opacity={0.5} />
      {mano === 'puño' && <path d="M-20,-8 L20,-8 M-20,6 L20,6" stroke={INK} strokeWidth={4} />}
    </g>
  </g>
);

/** Torso con playera roja (hombros en y=0, ancho 340). panza 0-1 la infla. */
export const Torso: React.FC<{ panza?: number; alto?: number }> = ({ panza = 0, alto = 430 }) => {
  const p = panza * 90;
  return (
    <g>
      <rect x={-34} y={-40} width={68} height={60} fill={PIEL} stroke={INK} strokeWidth={SW} />
      <path d={`M-175,40 Q-172,-6 -110,-10 L110,-10 Q172,-6 175,40 Q${190 + p},${alto * 0.6} 190,${alto} L-190,${alto} Q${-190 - p},${alto * 0.6} -175,40 Z`} fill={ROJO} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d={`M60,-8 L110,-10 Q172,-6 175,40 Q${190 + p},${alto * 0.6} 190,${alto} L120,${alto} Q${140 + p * 0.7},${alto * 0.5} 60,-8 Z`} fill={ROJO_S} />
      <path d="M-34,-12 Q0,14 34,-12 L34,-30 L-34,-30 Z" fill={PIEL_S} opacity={0.7} />
      <path d="M-50,-10 Q0,36 50,-10" fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d="M-50,-10 Q0,36 50,-10" fill="none" stroke={ROJO_S} strokeWidth={8} strokeLinecap="round" />
      <path d="M-140,120 Q-110,170 -130,230 M120,90 Q100,150 130,210 M-60,300 Q-20,320 20,300" fill="none" stroke={ROJO_S} strokeWidth={6} strokeLinecap="round" />
      <rect x={-130} y={70} width={70} height={60} rx={8} fill="none" stroke={ROJO_S} strokeWidth={6} />
      {panza > 0.05 && <path d={`M${-120 - p * 0.6},${alto * 0.62} Q0,${alto * 0.7 + p * 0.3} ${120 + p * 0.6},${alto * 0.62}`} fill="none" stroke={ROJO_S} strokeWidth={8} strokeLinecap="round" />}
      <path d={`M-175,40 Q-172,-6 -110,-10 L110,-10 Q172,-6 175,40 Q${190 + p},${alto * 0.6} 190,${alto} L-190,${alto} Q${-190 - p},${alto * 0.6} -175,40 Z`} fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    </g>
  );
};

/**
 * Barbudo de medio cuerpo. (x,y) = hombros. Los brazos se dan en coordenadas relativas a los hombros.
 * inclina: rotación de la cabeza (cabeceo), cabezaDy: desplazamiento vertical de la cabeza.
 */
export const Barbudo: React.FC<{
  x: number; y: number; s?: number; cabeza?: CabezaProps; panza?: number; inclina?: number; cabezaDy?: number; cabezaDx?: number;
  brazoI?: { e: [number, number]; m: [number, number]; mano?: 'abierta' | 'puño' | 'señala'; rot?: number };
  brazoD?: { e: [number, number]; m: [number, number]; mano?: 'abierta' | 'puño' | 'señala'; rot?: number };
  brazosDelante?: boolean; alto?: number;
}> = ({ x, y, s = 1, cabeza = {}, panza = 0, inclina = 0, cabezaDy = 0, cabezaDx = 0, brazoI, brazoD, brazosDelante = true, alto }) => {
  const bi = brazoI ?? { e: [-230, 200], m: [-200, 380] };
  const bd = brazoD ?? { e: [230, 200], m: [200, 380] };
  const brazos = (
    <>
      <Brazo s={[-150, 40]} e={bi.e} m={bi.m} mano={bi.mano} manoRot={bi.rot ?? 0} />
      <Brazo s={[150, 40]} e={bd.e} m={bd.m} mano={bd.mano} manoRot={bd.rot ?? 0} />
    </>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {!brazosDelante && brazos}
      <Torso panza={panza} alto={alto} />
      <g transform={`translate(${cabezaDx},${-200 + cabezaDy}) rotate(${inclina},0,160)`}><Cabeza {...cabeza} /></g>
      {brazosDelante && brazos}
    </g>
  );
};
