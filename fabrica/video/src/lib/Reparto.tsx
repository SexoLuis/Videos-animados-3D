/**
 * Reparto de personajes humanos en el estilo del barbudo (caricatura plana, contorno grueso, ojos grandes, sombreado).
 * <Persona rasgos={REPARTO.doctora} .../> funciona igual que <Barbudo>: (x,y) = hombros; la cabeza queda ~200 px arriba.
 * Las expresiones (boca, cejas, mira, parpado, sudor, dormido…) son las mismas que las del barbudo. Nunca hablan.
 */
import React, { useId } from 'react';
import { useCurrentFrame } from 'remotion';
import { INK, SW, Gota } from './base';
import type { CabezaProps } from './Barbudo';

export type Peinado = 'afro' | 'calvo' | 'coleta' | 'gorra' | 'chongo' | 'raya';
export type Ropa = 'playera' | 'bata' | 'tirantes' | 'sueter' | 'camisa' | 'mandil';
export interface Rasgos {
  nombre: string;
  piel: string; pielS: string; cachete: string;
  peinado: Peinado; pelo: string; peloBrillo: string;
  bigote?: string; lentes?: boolean; pecas?: boolean; arrugas?: boolean; pestañas?: boolean; labios?: string;
  ropa: Ropa; color: string; colorS: string; color2?: string; manga: 'corta' | 'larga' | 'ninguna';
  accesorio?: string; // color de la banda (deportista) o de la gorra (niño)
  cara?: [number, number]; // radios de la cara
}

export const REPARTO: Record<'doctora' | 'abuelo' | 'deportista' | 'nino' | 'abuela' | 'oficinista', Rasgos> = {
  doctora: { nombre: 'Dra. Lupe', piel: '#a8673f', pielS: '#8a5030', cachete: '#d0606a', peinado: 'afro', pelo: '#2a1a14', peloBrillo: '#4a3226',
    lentes: true, pestañas: true, labios: '#b8404a', ropa: 'bata', color: '#f4f6f8', colorS: '#d4dae2', color2: '#3fb8a8', manga: 'larga' },
  abuelo: { nombre: 'Don Chema', piel: '#f0c8a0', pielS: '#d8a47c', cachete: '#f08a80', peinado: 'calvo', pelo: '#eeeeee', peloBrillo: '#ffffff',
    bigote: '#f4f4f4', lentes: true, arrugas: true, ropa: 'sueter', color: '#c8a878', colorS: '#a8885a', color2: '#7a9ac8', manga: 'larga' },
  deportista: { nombre: 'Vale', piel: '#e8b088', pielS: '#cc9068', cachete: '#f07a7a', peinado: 'coleta', pelo: '#6a3a1e', peloBrillo: '#8a5430',
    pestañas: true, ropa: 'tirantes', color: '#4ccf6a', colorS: '#36a852', manga: 'ninguna', accesorio: '#ff5aa0' },
  nino: { nombre: 'Tito', piel: '#f5c49a', pielS: '#dca27a', cachete: '#f5857f', peinado: 'gorra', pelo: '#3a2416', peloBrillo: '#5a3a26',
    pecas: true, ropa: 'playera', color: '#ffc83d', colorS: '#e0a820', manga: 'corta', accesorio: '#3f7fe0', cara: [158, 160] },
  abuela: { nombre: 'Doña Rosa', piel: '#c8885a', pielS: '#aa6c42', cachete: '#e0707a', peinado: 'chongo', pelo: '#b8b8c0', peloBrillo: '#dcdce4',
    arrugas: true, labios: '#e05a8a', pestañas: true, ropa: 'mandil', color: '#9a5ab8', colorS: '#7a4098', color2: '#f4ecd8', manga: 'larga' },
  oficinista: { nombre: 'El Godín', piel: '#f1b38a', pielS: '#dc9670', cachete: '#f0857f', peinado: 'raya', pelo: '#3a2a1e', peloBrillo: '#5a4434',
    ropa: 'camisa', color: '#cfe4f8', colorS: '#a8c4e0', color2: '#d0404a', manga: 'larga' },
};

const CEJAS: Record<string, [number, number, number, number]> = {
  normal: [0, 0, 0, 0], arriba: [-6, 6, -16, -16], enojo: [18, -18, 6, 6], preocupado: [-16, 16, -4, -4], cansado: [8, -8, 8, 8], picaro: [0, 16, -14, 4],
};

/** Cabeza de cualquier personaje del reparto, centrada en (0,0) */
export const CabezaPersona: React.FC<CabezaProps & { r: Rasgos }> = ({ r, boca = 'sonrisa', cejas = 'normal', mira = [0, 0], parpado = 0, ojoGuino = false,
  parpadea = true, sudor = 0, rubor = 0, dormido = false }) => {
  const f = useCurrentFrame();
  const uid = 'p' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [rx, ry] = r.cara ?? [146, 166];
  const ph = (f + 41) % 110;
  const bl = parpadea && !dormido && ph < 6 ? Math.abs(ph - 3) / 3 : 1;
  const [ai, ad, hi, hd] = CEJAS[cejas] ?? CEJAS.normal;
  const ch = Math.sin(f * 2.4) > 0 ? 1 : 0;
  const mast = Math.abs(Math.sin(f / 3));
  const sway = Math.sin(f / 9) * 8;
  const P = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const };
  const by = 100; // altura de la boca

  const ojo = (x: number, cerrado: boolean) => {
    const ery = 42;
    if (cerrado || bl < 0.15) return <path key={x} d={`M${x - 32},-24 Q${x},-6 ${x + 32},-24`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />;
    const ly = -28 - ery + parpado * ery * 1.4;
    return (
      <g key={x}>
        <ellipse cx={x} cy={-28} rx={36} ry={ery * bl} fill="#fff" stroke={INK} strokeWidth={SW} />
        <circle cx={x + mira[0] * 13} cy={-28 + mira[1] * 13 * bl} r={18 * Math.min(1, bl + 0.2)} fill="#5a3418" stroke={INK} strokeWidth={3} />
        <circle cx={x + mira[0] * 13} cy={-28 + mira[1] * 13 * bl} r={10 * Math.min(1, bl + 0.2)} fill={INK} />
        <circle cx={x + mira[0] * 13 - 6} cy={-28 + mira[1] * 13 * bl - 7} r={6} fill="#fff" />
        {parpado > 0.02 && <path d={`M${x - 40},-28 L${x - 40},${-28 - ery - 4} L${x + 40},${-28 - ery - 4} L${x + 40},-28 L${x + 38},${ly} Q${x},${ly + 8} ${x - 38},${ly} Z`} fill={r.piel} />}
        {parpado > 0.02 && <path d={`M${x - 38},${ly} Q${x},${ly + 8} ${x + 38},${ly}`} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />}
        {r.pestañas && parpado < 0.3 && [-1, 1].map((sg) => <line key={sg} x1={x + sg * 30} y1={-28 - ery * bl * 0.75} x2={x + sg * 44} y2={-28 - ery * bl * 0.95} stroke={INK} strokeWidth={6} strokeLinecap="round" />)}
      </g>
    );
  };

  // ---------- pelo de atrás ----------
  const peloAtras = (() => {
    switch (r.peinado) {
      case 'afro':
        return (
          <g>
            {Array.from({ length: 11 }).map((_, k) => {
              const a = Math.PI * (0.95 + (k / 10) * 1.1);
              return <circle key={k} cx={Math.cos(a) * 170} cy={Math.sin(a) * 160 - 40} r={78} fill={r.pelo} {...P} />;
            })}
            <ellipse cx={0} cy={-60} rx={200} ry={170} fill={r.pelo} />
            {[[-90, -170], [60, -190], [150, -80], [-170, -60]].map(([x, y], k) => <path key={k} d={`M${x},${y} q16,-14 30,0`} fill="none" stroke={r.peloBrillo} strokeWidth={7} strokeLinecap="round" />)}
          </g>
        );
      case 'coleta':
        return (
          <g transform={`rotate(${sway},120,-120)`}>
            <path d="M120,-130 C260,-150 300,40 250,200 C230,250 190,260 180,220 C220,90 200,-40 110,-60 Z" fill={r.pelo} {...P} />
            <path d="M190,-60 C230,20 230,120 210,190" fill="none" stroke={r.peloBrillo} strokeWidth={8} strokeLinecap="round" />
            <rect x={96} y={-150} width={40} height={44} rx={12} fill={r.accesorio} {...P} transform="rotate(20,116,-128)" />
          </g>
        );
      case 'chongo':
        return (
          <g>
            <circle cx={0} cy={-200} r={70} fill={r.pelo} {...P} />
            <path d="M-40,-230 Q0,-260 40,-230" fill="none" stroke={r.peloBrillo} strokeWidth={7} strokeLinecap="round" />
            <rect x={-60} y={-160} width={120} height={20} rx={10} fill="#e05a8a" {...P} strokeWidth={4} />
          </g>
        );
      case 'calvo':
        return (
          <g>
            {[-1, 1].map((s) => <path key={s} d={`M${s * 120},-60 C${s * 190},-80 ${s * 200},20 ${s * 160},70 C${s * 150},30 ${s * 130},0 ${s * 120},-60 Z`} fill={r.pelo} {...P} />)}
          </g>
        );
      default:
        return null;
    }
  })();

  // ---------- pelo de enfrente ----------
  const peloFrente = (() => {
    switch (r.peinado) {
      case 'afro':
        return <path d={`M${-rx + 4},-40 Q${-rx + 10},${-ry - 10} 0,${-ry - 14} Q${rx - 10},${-ry - 10} ${rx - 4},-40 Q${rx - 30},-110 60,-118 Q0,-96 -60,-118 Q${-rx + 30},-110 ${-rx + 4},-40 Z`} fill={r.pelo} {...P} />;
      case 'coleta':
        return (
          <g>
            <path d={`M${-rx + 2},-30 Q${-rx},${-ry - 20} 0,${-ry - 18} Q${rx},${-ry - 20} ${rx - 2},-30 Q${rx - 20},-100 40,-118 Q-40,-140 ${-rx + 2},-30 Z`} fill={r.pelo} {...P} />
            <path d={`M${-rx + 6},-96 Q0,-150 ${rx - 6},-96`} fill="none" stroke={INK} strokeWidth={36} strokeLinecap="round" />
            <path d={`M${-rx + 6},-96 Q0,-150 ${rx - 6},-96`} fill="none" stroke={r.accesorio} strokeWidth={26} strokeLinecap="round" />
            <path d="M-80,-150 Q-40,-170 0,-166" fill="none" stroke={r.peloBrillo} strokeWidth={7} strokeLinecap="round" />
          </g>
        );
      case 'gorra':
        return (
          <g>
            <path d={`M${-rx - 6},-60 Q${-rx},${-ry - 60} 0,${-ry - 62} Q${rx},${-ry - 60} ${rx + 6},-60 Z`} fill={r.accesorio} {...P} />
            <path d={`M${-rx - 10},-64 Q0,-96 ${rx + 10},-64 Q${rx + 90},-60 ${rx + 110},-30 Q0,-40 ${-rx - 10},-64 Z`} fill={r.accesorio} {...P} />
            <path d={`M${-rx - 10},-64 Q0,-96 ${rx + 10},-64`} fill="none" stroke="#000" strokeOpacity={0.25} strokeWidth={8} />
            <circle cx={0} cy={-ry - 60} r={14} fill={r.accesorio} {...P} strokeWidth={4} />
            <path d="M-60,-200 Q-10,-224 40,-210" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={10} strokeLinecap="round" />
            {[-120, -90, 110].map((x, k) => <path key={k} d={`M${x},-60 l${k === 2 ? 14 : -14},30 l${k === 2 ? 8 : -8},-26`} fill={r.pelo} {...P} strokeWidth={4} />)}
          </g>
        );
      case 'chongo':
        return <path d={`M${-rx + 2},-30 Q${-rx},${-ry - 10} 0,${-ry - 12} Q${rx},${-ry - 10} ${rx - 2},-30 Q${rx - 30},-120 0,-122 Q${-rx + 30},-120 ${-rx + 2},-30 Z`} fill={r.pelo} {...P} />;
      case 'raya':
        return (
          <g>
            <path d={`M${-rx},-20 Q${-rx - 10},${-ry - 30} -10,${-ry - 34} Q${rx + 10},${-ry - 26} ${rx},-30 Q${rx - 20},-110 -20,-112 L-40,-150 Q${-rx + 20},-120 ${-rx},-20 Z`} fill={r.pelo} {...P} />
            <path d="M-40,-150 Q-20,-180 30,-196" fill="none" stroke={r.peloBrillo} strokeWidth={7} strokeLinecap="round" />
            <path d="M40,-150 Q90,-170 120,-120" fill="none" stroke={r.peloBrillo} strokeWidth={7} strokeLinecap="round" />
          </g>
        );
      default:
        return null;
    }
  })();

  return (
    <g>
      {peloAtras}
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * (rx - 2)} cy={4} r={34} fill={r.piel} {...P} />
          <circle cx={s * (rx + 2)} cy={8} r={16} fill={r.pielS} opacity={0.6} />
        </g>
      ))}
      <defs><clipPath id={uid}><ellipse cx={0} cy={0} rx={rx} ry={ry} /></clipPath></defs>
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={r.piel} />
      <g clipPath={`url(#${uid})`}>
        <ellipse cx={rx + 55} cy={20} rx={120} ry={220} fill={r.pielS} opacity={0.55} />
        <ellipse cx={-55} cy={-108} rx={58} ry={26} fill="#fff" opacity={r.peinado === 'calvo' ? 0.4 : 0.2} />
        <ellipse cx={0} cy={ry + 10} rx={rx + 20} ry={50} fill={r.pielS} opacity={0.5} />
      </g>
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={SW} />
      {r.arrugas && (
        <g fill="none" stroke={r.pielS} strokeWidth={6} strokeLinecap="round">
          <path d="M-60,-132 Q0,-144 60,-132" /><path d="M-44,-114 Q0,-124 44,-114" />
          <path d="M-112,-30 l-14,-8 M-112,-16 l-16,0 M112,-30 l14,-8 M112,-16 l16,0" />
          <path d="M-70,60 Q-80,90 -64,118 M70,60 Q80,90 64,118" />
        </g>
      )}
      {peloFrente}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={s * 88} cy={38} rx={30} ry={20} fill={r.cachete} opacity={0.8 + rubor * 0.2} />
          <line x1={s * 96 - 10} y1={28} x2={s * 96 - 2} y2={20} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          <line x1={s * 96 + 4} y1={30} x2={s * 96 + 12} y2={22} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {r.pecas && [[-100, 14], [-84, 24], [-110, 30], [100, 14], [84, 24], [110, 30], [-20, 30], [20, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill={r.pielS} />)}
      {ojo(-54, dormido)}
      {ojoGuino ? <path d="M22,-26 Q54,-42 86,-26" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" /> : ojo(54, dormido)}
      {r.lentes && (
        <g fill="#cfeaff" fillOpacity={0.18} stroke={INK} strokeWidth={7}>
          <circle cx={-54} cy={-28} r={50} /><circle cx={54} cy={-28} r={50} />
          <path d="M-4,-34 Q0,-42 4,-34" fill="none" />
          <line x1={-104} y1={-34} x2={-rx + 4} y2={-44} /><line x1={104} y1={-34} x2={rx - 4} y2={-44} />
          <path d="M-80,-56 L-64,-66" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
        </g>
      )}
      <rect x={-90} y={-100 + hi} width={70} height={16} rx={8} fill={r.peinado === 'calvo' ? '#d8d8d8' : r.pelo} stroke={INK} strokeWidth={3} transform={`rotate(${ai},-55,${-92 + hi})`} />
      <rect x={20} y={-100 + hd} width={70} height={16} rx={8} fill={r.peinado === 'calvo' ? '#d8d8d8' : r.pelo} stroke={INK} strokeWidth={3} transform={`rotate(${ad},55,${-92 + hd})`} />
      <path d="M-18,16 Q-24,44 0,48 Q24,44 18,16" fill={r.pielS} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      {r.bigote && <path d="M-74,74 Q-36,52 0,68 Q36,52 74,74 Q50,96 0,84 Q-50,96 -74,74 Z" fill={r.bigote} {...P} />}
      <g transform={`translate(0,${by})`}>
        {boca === 'sonrisa' && <path d="M-32,-4 Q0,24 32,-4" fill="none" stroke={r.labios ?? INK} strokeWidth={r.labios ? 10 : 7} strokeLinecap="round" />}
        {boca === 'grande' && <path d="M-38,-10 Q0,40 38,-10 Z" fill="#7a2030" stroke={INK} strokeWidth={6} strokeLinejoin="round" />}
        {boca === 'culpable' && <path d="M-34,-2 Q-10,10 6,2 Q22,-6 34,-12" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {boca === 'plana' && <path d="M-26,0 L26,0" stroke={r.labios ?? INK} strokeWidth={r.labios ? 10 : 7} strokeLinecap="round" />}
        {boca === 'triste' && <path d="M-28,12 Q0,-10 28,12" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {boca === 'ondulada' && <path d="M-34,4 Q-22,-8 -10,4 Q2,14 12,2 Q22,-10 34,4" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
        {boca === 'o' && <ellipse cx={0} cy={4} rx={15} ry={20} fill="#7a2030" stroke={INK} strokeWidth={6} />}
        {boca === 'abierta' && <g><ellipse cx={0} cy={6} rx={36} ry={26} fill="#7a2030" stroke={INK} strokeWidth={6} /><ellipse cx={0} cy={20} rx={18} ry={9} fill="#f07080" /></g>}
        {boca === 'bostezo' && <g><ellipse cx={0} cy={8} rx={32} ry={36} fill="#5a1424" stroke={INK} strokeWidth={6} /><ellipse cx={0} cy={28} rx={16} ry={8} fill="#f07080" /></g>}
        {boca === 'mastica' && <path d={`M-30,${-2 + mast * 4} Q0,${12 - mast * 8} 30,${-2 + mast * 4}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        {boca === 'dientes' && (
          <g>
            <rect x={-40} y={-16} width={80} height={36} rx={10} fill="#fff" stroke={INK} strokeWidth={6} />
            <line x1={-40} x2={40} y1={2 + ch * 2} y2={2 + ch * 2} stroke={INK} strokeWidth={4} />
            {[-20, 0, 20].map((x) => <line key={x} x1={x} x2={x} y1={-16} y2={20} stroke={INK} strokeWidth={4} />)}
          </g>
        )}
      </g>
      {sudor > 0 && [[-118, -60], [126, -40], [-100, 40]].map(([x, y], i) => <Gota key={i} x={x} y={y + ((f * 1.4 + i * 30) % 60)} s={0.9} o={sudor} />)}
    </g>
  );
};

/** Brazo con manga configurable */
export const BrazoPersona: React.FC<{ r: Rasgos; s: [number, number]; e: [number, number]; m: [number, number]; mano?: 'abierta' | 'puño' | 'señala'; rot?: number }> = ({ r, s, e, m, mano = 'abierta', rot = 0 }) => {
  const mangaHasta: [number, number] = r.manga === 'larga' ? [(e[0] * 0.2 + m[0] * 0.8), (e[1] * 0.2 + m[1] * 0.8)] : [(s[0] + e[0] * 2) / 3, (s[1] + e[1] * 2) / 3];
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={`M${s[0]},${s[1]} L${e[0]},${e[1]} L${m[0]},${m[1]}`} stroke={INK} strokeWidth={60 + SW * 2} />
      <path d={`M${s[0]},${s[1]} L${e[0]},${e[1]} L${m[0]},${m[1]}`} stroke={r.piel} strokeWidth={48} />
      {r.manga !== 'ninguna' && (
        <>
          <path d={r.manga === 'larga' ? `M${s[0]},${s[1]} L${e[0]},${e[1]} L${mangaHasta[0]},${mangaHasta[1]}` : `M${s[0]},${s[1]} L${mangaHasta[0]},${mangaHasta[1]}`} stroke={r.color} strokeWidth={60} />
          <circle cx={mangaHasta[0]} cy={mangaHasta[1]} r={31} fill={r.colorS} stroke={INK} strokeWidth={4} />
        </>
      )}
      <g transform={`translate(${m[0]},${m[1]}) rotate(${rot})`}>
        {mano === 'señala' && <rect x={-9} y={-78} width={20} height={60} rx={10} fill={r.piel} stroke={INK} strokeWidth={SW} />}
        <circle r={34} fill={r.piel} stroke={INK} strokeWidth={SW} />
        {mano === 'abierta' && [-23, -8, 7, 22].map((x) => <rect key={x} x={x - 8} y={-56} width={16} height={32} rx={8} fill={r.piel} stroke={INK} strokeWidth={5} />)}
        {mano === 'puño' && <path d="M-20,-8 L20,-8 M-20,6 L20,6" stroke={INK} strokeWidth={4} />}
        <ellipse cx={10} cy={10} rx={16} ry={12} fill={r.pielS} opacity={0.5} />
      </g>
    </g>
  );
};

/** Torso según el tipo de ropa (hombros en y=0) */
export const TorsoPersona: React.FC<{ r: Rasgos; panza?: number; alto?: number }> = ({ r, panza = 0, alto = 430 }) => {
  const p = panza * 90;
  const P = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const };
  const cuerpo = `M-170,40 Q-168,-6 -108,-10 L108,-10 Q168,-6 170,40 Q${186 + p},${alto * 0.6} 186,${alto} L-186,${alto} Q${-186 - p},${alto * 0.6} -170,40 Z`;
  const sombra = `M60,-8 L108,-10 Q168,-6 170,40 Q${186 + p},${alto * 0.6} 186,${alto} L120,${alto} Q${140 + p * 0.7},${alto * 0.5} 60,-8 Z`;
  return (
    <g>
      <rect x={-32} y={-40} width={64} height={60} fill={r.piel} {...P} />
      <path d="M-32,-12 Q0,14 32,-12 L32,-30 L-32,-30 Z" fill={r.pielS} opacity={0.7} />
      {r.ropa === 'tirantes' ? (
        <g>
          <path d={cuerpo} fill={r.piel} {...P} />
          <path d={`M-110,${alto * 0.18} Q0,${alto * 0.3} 110,${alto * 0.18} L150,${alto} L-150,${alto} Z`} fill={r.color} {...P} />
          <path d={`M-110,${alto * 0.18} L-80,-10 L-50,-10 L-60,${alto * 0.22} M110,${alto * 0.18} L80,-10 L50,-10 L60,${alto * 0.22}`} fill={r.color} {...P} />
          <path d={`M60,${alto * 0.24} L110,${alto * 0.18} L150,${alto} L110,${alto} Z`} fill={r.colorS} />
        </g>
      ) : (
        <g>
          <path d={cuerpo} fill={r.color} />
          <path d={sombra} fill={r.colorS} />
          {r.ropa === 'playera' && <path d="M-50,-10 Q0,36 50,-10" fill="none" stroke={r.colorS} strokeWidth={14} strokeLinecap="round" />}
          {r.ropa === 'playera' && <path transform="translate(-10,160) scale(1.6)" d="M0,-30 L9,-9 L31,-9 L13,4 L20,26 L0,12 L-20,26 L-13,4 L-31,-9 L-9,-9 Z" fill="#fff" fillOpacity={0.85} stroke={INK} strokeWidth={3} />}
          {r.ropa === 'bata' && (
            <g>
              <path d={`M-40,-10 L0,${alto * 0.45} L40,-10 Z`} fill={r.color2} {...P} />
              <path d={`M-40,-10 L0,${alto * 0.45} L-70,${alto * 0.2} Z M40,-10 L0,${alto * 0.45} L70,${alto * 0.2} Z`} fill="#e4e8ee" {...P} strokeWidth={4} />
              <line x1={0} y1={alto * 0.45} x2={0} y2={alto} stroke={INK} strokeWidth={5} />
              <rect x={-150} y={alto * 0.58} width={70} height={60} rx={8} fill="none" stroke={r.colorS} strokeWidth={6} />
              <rect x={80} y={alto * 0.3} width={60} height={50} rx={6} fill="none" stroke={r.colorS} strokeWidth={6} />
              <rect x={100} y={alto * 0.22} width={10} height={44} rx={4} fill="#3f7fe0" {...P} strokeWidth={3} />
              {/* estetoscopio */}
              <path d={`M-60,-6 Q-110,${alto * 0.3} -40,${alto * 0.4}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
              <path d={`M-60,-6 Q-110,${alto * 0.3} -40,${alto * 0.4}`} fill="none" stroke="#4a4f66" strokeWidth={5} strokeLinecap="round" />
              <circle cx={-36} cy={alto * 0.42} r={16} fill="#c8ccd8" {...P} strokeWidth={4} />
            </g>
          )}
          {r.ropa === 'sueter' && (
            <g>
              <path d="M-44,-10 L0,60 L44,-10" fill={r.color2} {...P} />
              <line x1={0} y1={60} x2={0} y2={alto} stroke={INK} strokeWidth={5} />
              {[110, 190, 270, 350].map((y) => <circle key={y} cx={16} cy={y} r={9} fill="#7a5a3a" stroke={INK} strokeWidth={3} />)}
              <path d={`M-186,${alto - 30} L186,${alto - 30}`} stroke={r.colorS} strokeWidth={10} />
            </g>
          )}
          {r.ropa === 'camisa' && (
            <g>
              <path d="M-46,-12 L-8,40 L-60,30 Z M46,-12 L8,40 L60,30 Z" fill="#fff" {...P} strokeWidth={4} />
              <path d={`M-12,30 L12,30 L22,${alto * 0.7} L0,${alto * 0.8} L-22,${alto * 0.7} Z`} fill={r.color2} {...P} strokeWidth={4} />
              <rect x={-16} y={20} width={32} height={22} rx={6} fill={r.color2} {...P} strokeWidth={4} />
              <rect x={70} y={90} width={60} height={50} rx={6} fill="none" stroke={r.colorS} strokeWidth={6} />
            </g>
          )}
          {r.ropa === 'mandil' && (
            <g>
              <path d={`M-110,${alto * 0.22} L110,${alto * 0.22} L140,${alto} L-140,${alto} Z`} fill={r.color2} {...P} />
              <path d={`M-90,${alto * 0.22} L-60,-6 M90,${alto * 0.22} L60,-6`} stroke={r.color2} strokeWidth={14} />
              <rect x={-60} y={alto * 0.55} width={120} height={70} rx={10} fill="none" stroke="#d8ccb0" strokeWidth={6} />
              {[[-70, 0.4], [40, 0.7], [-20, 0.85], [90, 0.45]].map(([x, k], i) => <circle key={i} cx={x} cy={alto * k} r={9} fill="#e05a8a" opacity={0.6} />)}
            </g>
          )}
          <path d={cuerpo} fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

/** Personaje del reparto de medio cuerpo. Misma API que <Barbudo>. */
export const Persona: React.FC<{
  r: Rasgos; x: number; y: number; s?: number; cabeza?: CabezaProps; panza?: number; inclina?: number; cabezaDy?: number; cabezaDx?: number;
  brazoI?: { e: [number, number]; m: [number, number]; mano?: 'abierta' | 'puño' | 'señala'; rot?: number };
  brazoD?: { e: [number, number]; m: [number, number]; mano?: 'abierta' | 'puño' | 'señala'; rot?: number };
  brazosDelante?: boolean; alto?: number;
}> = ({ r, x, y, s = 1, cabeza = {}, panza = 0, inclina = 0, cabezaDy = 0, cabezaDx = 0, brazoI, brazoD, brazosDelante = true, alto }) => {
  const bi = brazoI ?? { e: [-230, 200], m: [-200, 380] };
  const bd = brazoD ?? { e: [230, 200], m: [200, 380] };
  const brazos = (
    <>
      <BrazoPersona r={r} s={[-148, 40]} e={bi.e} m={bi.m} mano={bi.mano} rot={bi.rot} />
      <BrazoPersona r={r} s={[148, 40]} e={bd.e} m={bd.m} mano={bd.mano} rot={bd.rot} />
    </>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {!brazosDelante && brazos}
      <TorsoPersona r={r} panza={panza} alto={alto} />
      <g transform={`translate(${cabezaDx},${-200 + cabezaDy}) rotate(${inclina},0,160)`}><CabezaPersona r={r} {...cabeza} /></g>
      {brazosDelante && brazos}
    </g>
  );
};
