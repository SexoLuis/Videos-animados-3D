/**
 * Personajes del interior del cuerpo, todos con contorno grueso, ojitos y reacciones.
 * Cada uno está centrado en (0,0).
 */
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { INK, SW } from './base';

export type Ojos = 'normal' | 'feliz' | 'sueño' | 'cerrados' | 'susto' | 'enojo';

/** Par de ojitos reutilizable */
export const Ojitos: React.FC<{ x?: number; y?: number; sep?: number; r?: number; tipo?: Ojos; mira?: [number, number]; iris?: string; piel?: string }> = ({ x = 0, y = 0, sep = 40, r = 26, tipo = 'normal', mira = [0, 0], iris = INK, piel = '#f59ac0' }) => {
  const f = useCurrentFrame();
  const ph = (f + Math.round(x * 3 + y)) % 97;
  const bl = tipo === 'normal' && ph < 5 ? 0.1 : 1;
  return (
    <g transform={`translate(${x},${y})`}>
      {[-1, 1].map((s) => {
        const cx = s * sep;
        if (tipo === 'cerrados') return <path key={s} d={`M${cx - r * 0.8},0 Q${cx},${r * 0.6} ${cx + r * 0.8},0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
        if (tipo === 'feliz') return <path key={s} d={`M${cx - r * 0.8},${r * 0.2} Q${cx},${-r * 0.8} ${cx + r * 0.8},${r * 0.2}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
        const ry = (tipo === 'susto' ? 1.2 : 1) * r * bl;
        return (
          <g key={s}>
            <ellipse cx={cx} cy={0} rx={r * (tipo === 'susto' ? 1.1 : 0.9)} ry={ry} fill="#fff" stroke={INK} strokeWidth={5} />
            {bl > 0.5 && <circle cx={cx + mira[0] * r * 0.35} cy={mira[1] * r * 0.35 + (tipo === 'sueño' ? r * 0.3 : 0)} r={r * (tipo === 'susto' ? 0.32 : 0.45)} fill={iris} />}
            {bl > 0.5 && <circle cx={cx + mira[0] * r * 0.35 - r * 0.15} cy={mira[1] * r * 0.35 - r * 0.15} r={r * 0.15} fill="#fff" />}
            {tipo === 'sueño' && <path d={`M${cx - r},${-r * 0.15} L${cx - r},${-r - 4} L${cx + r},${-r - 4} L${cx + r},${-r * 0.15} Z`} fill={piel} />}
            {tipo === 'sueño' && <line x1={cx - r} x2={cx + r} y1={-r * 0.15} y2={-r * 0.15} stroke={INK} strokeWidth={5} strokeLinecap="round" />}
            {tipo === 'enojo' && <line x1={cx - r} x2={cx + r} y1={-r - 6 + s * 8} y2={-r - 6 - s * 8} stroke={INK} strokeWidth={8} strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
};

/** Boquita simple de personaje secundario */
export const Boquita: React.FC<{ x?: number; y?: number; tipo?: 'sonrisa' | 'o' | 'bostezo' | 'plana' | 'triste' | 'grande'; w?: number }> = ({ x = 0, y = 0, tipo = 'sonrisa', w = 30 }) => (
  <g transform={`translate(${x},${y})`}>
    {tipo === 'sonrisa' && <path d={`M${-w},0 Q0,${w * 0.8} ${w},0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
    {tipo === 'grande' && <path d={`M${-w},0 Q0,${w * 1.3} ${w},0 Z`} fill="#7a2030" stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
    {tipo === 'triste' && <path d={`M${-w},${w * 0.4} Q0,${-w * 0.4} ${w},${w * 0.4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
    {tipo === 'plana' && <path d={`M${-w * 0.7},0 L${w * 0.7},0`} stroke={INK} strokeWidth={6} strokeLinecap="round" />}
    {tipo === 'o' && <ellipse rx={w * 0.4} ry={w * 0.5} fill="#7a2030" stroke={INK} strokeWidth={5} />}
    {tipo === 'bostezo' && <ellipse rx={w * 0.7} ry={w * 0.9} fill="#5a1424" stroke={INK} strokeWidth={5} />}
  </g>
);

/** Cerebro rosa con pliegues, ojos amarillos y patitas verdes. audifonos = operador */
export const Cerebro: React.FC<{ ojos?: Ojos; boca?: 'sonrisa' | 'o' | 'bostezo' | 'plana' | 'triste' | 'grande'; audifonos?: boolean; mira?: [number, number]; patas?: number; color?: string }> = ({ ojos = 'normal', boca = 'sonrisa', audifonos = false, mira = [0, 0], patas = 0, color = '#f59ac0' }) => {
  const f = useCurrentFrame();
  const paso = Math.sin(f / 3) * patas * 14;
  return (
    <g>
      {/* patitas */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * 50},110 L${s * 56 + (s > 0 ? paso : -paso)},200`} stroke={INK} strokeWidth={24 + SW} strokeLinecap="round" />
          <path d={`M${s * 50},110 L${s * 56 + (s > 0 ? paso : -paso)},200`} stroke="#7ed957" strokeWidth={24} strokeLinecap="round" />
          <ellipse cx={s * 64 + (s > 0 ? paso : -paso)} cy={206} rx={30} ry={14} fill="#7ed957" stroke={INK} strokeWidth={SW} />
        </g>
      ))}
      <path d="M-190,20 C-210,-90 -120,-170 -30,-150 C20,-190 130,-170 160,-100 C230,-60 220,60 150,100 C110,150 -60,160 -120,120 C-190,110 -210,70 -190,20 Z" fill={color} stroke={INK} strokeWidth={SW} />
      <g fill="none" stroke="#c2557f" strokeWidth={7} strokeLinecap="round">
        <path d="M-150,-40 Q-120,-80 -80,-60 Q-60,-100 -20,-90" />
        <path d="M30,-120 Q60,-90 100,-110 Q130,-70 170,-60" />
        <path d="M-170,60 Q-130,40 -110,80" />
        <path d="M110,70 Q150,40 180,60" />
        <path d="M0,-150 Q-10,-120 10,-100" />
      </g>
      <path d="M-170,60 C-120,140 60,150 150,100 C110,150 -60,160 -120,120 C-190,110 -210,70 -170,60 Z" fill="#000" opacity={0.12} />
      <ellipse cx={-80} cy={-110} rx={50} ry={20} fill="#fff" opacity={0.35} transform="rotate(-15,-80,-110)" />
      <Ojitos y={10} sep={56} r={34} tipo={ojos} mira={mira} iris="#e0a800" piel={color} />
      <Boquita y={78} tipo={boca} w={28} />
      {audifonos && (
        <g>
          <path d="M-200,0 Q-200,-210 0,-210 Q200,-210 200,0" fill="none" stroke={INK} strokeWidth={16} />
          <path d="M-200,0 Q-200,-210 0,-210 Q200,-210 200,0" fill="none" stroke="#444a66" strokeWidth={9} />
          {[-1, 1].map((s) => <rect key={s} x={s * 205 - 26} y={-40} width={52} height={86} rx={22} fill="#444a66" stroke={INK} strokeWidth={SW} />)}
          <path d="M-205,40 Q-200,110 -90,110" fill="none" stroke={INK} strokeWidth={7} />
          <circle cx={-86} cy={110} r={13} fill="#444a66" stroke={INK} strokeWidth={5} />
        </g>
      )}
    </g>
  );
};

/** Estómago rojo con rayas blancas. lleno 0-1 lo infla; amasa = movimiento de digestión */
export const Estomago: React.FC<{ lleno?: number; amasa?: number; ojos?: Ojos; boca?: 'sonrisa' | 'o' | 'bostezo' | 'plana' | 'triste' | 'grande' }> = ({ lleno = 0, amasa = 0, ojos = 'normal', boca = 'sonrisa' }) => {
  const f = useCurrentFrame();
  const k = 1 + lleno * 0.45;
  const w = Math.sin(f / 4) * amasa;
  return (
    <g transform={`scale(${k * (1 + w * 0.05)},${k * (1 - w * 0.05)})`}>
      <path d="M-40,-200 Q-40,-140 -70,-120 C-200,-60 -190,120 -40,150 C80,175 190,120 170,20 C160,-40 110,-60 70,-40 Q20,-20 10,-80 L20,-200 Z" fill="#e8505b" stroke={INK} strokeWidth={SW / k} strokeLinejoin="round" />
      <g fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={8 / k} strokeLinecap="round">
        <path d="M-120,-20 Q-60,-50 -10,-20" /><path d="M-130,40 Q-50,10 20,40" /><path d="M-100,100 Q0,80 100,100" /><path d="M60,10 Q110,-10 150,20" />
      </g>
      <ellipse cx={-120} cy={-40} rx={22} ry={40} fill="#fff" opacity={0.3} transform="rotate(25,-120,-40)" />
      <path d="M-150,80 C-100,150 80,170 160,80 C150,150 40,180 -40,150 C-100,140 -140,110 -150,80 Z" fill="#000" opacity={0.15} />
      <Ojitos x={-40} y={20} sep={34} r={22} tipo={ojos} piel="#e8505b" />
      <Boquita x={-40} y={70} tipo={boca} w={20} />
    </g>
  );
};

/** Corazón rojo; late a ritmo bpm (latidos por minuto en pantalla) */
export const Corazon: React.FC<{ bpm?: number; ojos?: Ojos; boca?: 'sonrisa' | 'o' | 'bostezo' | 'plana' | 'triste' | 'grande' }> = ({ bpm = 70, ojos = 'normal', boca = 'sonrisa' }) => {
  const f = useCurrentFrame();
  const ph = ((f / 30) * bpm / 60) % 1;
  const b = ph < 0.12 ? Math.sin((ph / 0.12) * Math.PI) : 0;
  return (
    <g transform={`scale(${1 + b * 0.12})`}>
      <path d="M0,170 C-60,110 -200,40 -200,-60 C-200,-140 -120,-180 -60,-160 C-30,-150 -10,-130 0,-110 C10,-130 30,-150 60,-160 C120,-180 200,-140 200,-60 C200,40 60,110 0,170 Z" fill="#e8505b" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse cx={-110} cy={-90} rx={40} ry={22} fill="#fff" opacity={0.35} transform="rotate(-30,-110,-90)" />
      <path d="M0,170 C-60,110 -200,40 -200,-60 C-160,40 -40,100 0,130 C40,100 160,40 200,-60 C200,40 60,110 0,170 Z" fill="#000" opacity={0.15} />
      <path d="M40,-150 Q80,-110 60,-60" stroke="#b83040" strokeWidth={8} fill="none" strokeLinecap="round" />
      <Ojitos y={-20} sep={52} r={28} tipo={ojos} piel="#e8505b" />
      <Boquita y={50} tipo={boca} w={26} />
    </g>
  );
};

/** Pulmones rosados; respira con periodo en segundos */
export const Pulmones: React.FC<{ periodo?: number; ojos?: Ojos; boca?: 'sonrisa' | 'o' | 'bostezo' | 'plana' | 'triste' | 'grande' }> = ({ periodo = 2, ojos = 'normal', boca = 'sonrisa' }) => {
  const f = useCurrentFrame();
  const r = 1 + 0.09 * Math.sin((f / 30 / periodo) * Math.PI * 2);
  return (
    <g>
      <path d="M-14,-230 L14,-230 L14,-120 Q60,-90 90,-60 M-14,-120 Q-60,-90 -90,-60" fill="none" stroke={INK} strokeWidth={26 + SW} strokeLinecap="round" />
      <path d="M0,-230 L0,-120 M0,-120 Q60,-90 90,-60 M0,-120 Q-60,-90 -90,-60" fill="none" stroke="#f3d3dc" strokeWidth={26} strokeLinecap="round" />
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 120},40) scale(${r})`}>
          <path d={`M${s * -40},-150 C${s * 80},-190 ${s * 120},-40 ${s * 110},90 C${s * 100},160 ${s * -10},170 ${s * -60},140 C${s * -70},40 ${s * -70},-80 ${s * -40},-150 Z`} fill="#f59aaa" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d={`M${s * 0},-60 Q${s * 40},0 ${s * 20},60`} fill="none" stroke="#d0607a" strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      <Ojitos y={60} sep={120} r={26} tipo={ojos} piel="#f59aaa" />
      <Boquita y={130} tipo={boca} w={24} />
    </g>
  );
};

/** Intestino: tubo rosado enrollado con ojitos */
export const Intestino: React.FC<{ ojos?: Ojos; mueve?: number }> = ({ ojos = 'normal', mueve = 1 }) => {
  const f = useCurrentFrame();
  const w = Math.sin(f / 6) * 8 * mueve;
  const d = `M-220,-120 Q-220,-200 -120,-200 L120,-200 Q220,-200 220,-120 L220,${120 + w} Q220,200 120,200 L-60,200 Q-140,200 -140,${120 - w} L-140,-40 Q-140,-110 -60,-110 L60,-110 Q130,-110 130,-40 L130,${60 + w} Q130,110 70,110 L-20,110 Q-50,110 -50,70 L-50,-10`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={84 + SW * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#f48aa0" strokeWidth={84} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={20} strokeLinecap="round" strokeDasharray="30 60" />
      <Ojitos x={-50} y={-30} sep={30} r={22} tipo={ojos} piel="#f48aa0" />
    </g>
  );
};

/** Mensajero hormonal: gotita verde con ojitos y un sobre (sin texto) */
export const Mensajero: React.FC<{ color?: string; sobre?: boolean; paso?: number }> = ({ color = '#7ed957', sobre = true, paso = 1 }) => {
  const f = useCurrentFrame();
  const b = Math.abs(Math.sin(f / 3)) * 12 * paso;
  return (
    <g transform={`translate(0,${-b})`}>
      <path d="M0,-80 C40,-30 60,0 60,30 A60,60 0 0 1 -60,30 C-60,0 -40,-30 0,-80 Z" fill={color} stroke={INK} strokeWidth={SW} />
      <Ojitos y={20} sep={20} r={14} tipo="feliz" />
      {sobre && (
        <g transform="translate(52,40) rotate(-12)">
          <rect x={-30} y={-20} width={60} height={42} rx={4} fill="#fff6e0" stroke={INK} strokeWidth={5} />
          <path d="M-30,-20 L0,4 L30,-20" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={0} cy={6} r={7} fill="#e8505b" stroke={INK} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/** Rayo de energía amarillo con ojitos */
export const Rayo: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <path d="M20,-90 L-50,10 L0,10 L-20,90 L50,-15 L4,-15 Z" fill="#ffd23f" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <Ojitos x={0} y={-5} sep={13} r={9} tipo="feliz" />
  </g>
);
