/**
 * Escenarios con detalle (nunca fondos vacíos). Coordenadas del mundo 1080×1920; usar con <Cam>.
 * Todo con contorno grueso INK y colores planos.
 */
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { INK, SW, rnd, mix } from './base';
import { Ojitos, Boquita } from './Cuerpo';

const P = { strokeWidth: SW, stroke: INK, strokeLinejoin: 'round' as const };

/** Ventana con cielo: hora 0 = mediodía, 1 = media tarde (sol más bajo y naranja), 2 = noche (luna). lluvia opcional */
export const Ventana: React.FC<{ x: number; y: number; w?: number; h?: number; hora?: number; lluvia?: boolean; cortina?: string }> = ({ x, y, w = 300, h = 360, hora = 0, lluvia = false, cortina = '#3f6fae' }) => {
  const f = useCurrentFrame();
  const noche = Math.max(0, hora - 1);
  const cieloA = mix(mix('#7cc8f0', '#f0a060', Math.min(1, hora)), '#1b2a55', noche);
  const cieloB = mix(mix('#cfeefa', '#ffd59a', Math.min(1, hora)), '#2c3f73', noche);
  const solX = x + w * (0.3 + Math.min(1, hora) * 0.45), solY = y + h * (0.28 + Math.min(1, hora) * 0.4);
  const id = 'cielo' + Math.round(x) + Math.round(y);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={cieloA} /><stop offset="1" stopColor={cieloB} /></linearGradient>
        <clipPath id={id + 'c'}><rect x={x} y={y} width={w} height={h} /></clipPath>
      </defs>
      <rect x={x - 18} y={y - 18} width={w + 36} height={h + 36} rx={10} fill="#6b4a3a" {...P} />
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} {...P} />
      <g clipPath={`url(#${id}c)`}>
        {noche < 0.5 ? (
          <circle cx={solX} cy={solY} r={44} fill={mix('#ffe26a', '#ff9a3a', Math.min(1, hora))} {...P} />
        ) : (
          <g><circle cx={x + w * 0.65} cy={y + h * 0.3} r={40} fill="#fff2c0" {...P} /><circle cx={x + w * 0.65 + 18} cy={y + h * 0.3 - 10} r={34} fill={cieloA} /></g>
        )}
        {noche < 0.5 && [0, 1].map((k) => {
          const cx = x + ((f * (0.6 + k * 0.3) + k * 170) % (w + 200)) - 100;
          return <g key={k} transform={`translate(${cx},${y + 80 + k * 90})`}><ellipse rx={50} ry={22} fill="#fff" {...P} strokeWidth={4} /><ellipse cx={30} cy={-12} rx={30} ry={20} fill="#fff" /></g>;
        })}
        {lluvia && Array.from({ length: 30 }).map((_, i) => {
          const lx = x + rnd(i) * w, ly = y + ((f * (16 + rnd(i + 3) * 8) + rnd(i + 5) * h) % (h + 40)) - 20;
          return <line key={i} x1={lx} y1={ly} x2={lx - 5} y2={ly + 26} stroke="#cfeaff" strokeWidth={4} strokeLinecap="round" />;
        })}
      </g>
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} {...P} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} {...P} />
      <path d={`M${x - 40},${y - 30} L${x + 50},${y - 30} Q${x + 30},${y + h * 0.5} ${x + 60},${y + h + 30} L${x - 40},${y + h + 30} Z`} fill={cortina} {...P} />
      <path d={`M${x + w + 40},${y - 30} L${x + w - 50},${y - 30} Q${x + w - 30},${y + h * 0.5} ${x + w - 60},${y + h + 30} L${x + w + 40},${y + h + 30} Z`} fill={cortina} {...P} />
      <rect x={x - 70} y={y - 46} width={w + 140} height={22} rx={11} fill="#4a3428" {...P} />
    </g>
  );
};

/** Reloj de pared con carita; hora en horas (0-12) */
export const Reloj: React.FC<{ x: number; y: number; r?: number; hora: number; cara?: boolean; ojos?: 'normal' | 'sueño' | 'feliz' }> = ({ x, y, r = 110, hora, cara = true, ojos = 'normal' }) => {
  const am = (hora % 12) * 30, mm = (hora % 1) * 360;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r + 14} fill="#c0553f" {...P} />
      <circle r={r} fill="#fff6e6" {...P} />
      {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={0} y1={-r + 12} x2={0} y2={-r + (i % 3 ? 22 : 32)} stroke={INK} strokeWidth={i % 3 ? 4 : 7} transform={`rotate(${i * 30})`} strokeLinecap="round" />)}
      {cara && <Ojitos y={-r * 0.35} sep={r * 0.3} r={r * 0.16} tipo={ojos} piel="#fff6e6" />}
      {cara && <Boquita y={r * 0.5} tipo={ojos === 'sueño' ? 'bostezo' : 'sonrisa'} w={r * 0.18} />}
      <line x1={0} y1={0} x2={0} y2={-r * 0.5} stroke={INK} strokeWidth={12} strokeLinecap="round" transform={`rotate(${am})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.78} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${mm})`} />
      <circle r={12} fill={INK} />
    </g>
  );
};

/** Plato con comida. montaña 0-1 = tamaño de la porción */
export const Plato: React.FC<{ x: number; y: number; s?: number; montaña?: number; vacio?: boolean }> = ({ x, y, s = 1, montaña = 0.5, vacio = false }) => {
  const h = 30 + montaña * 220;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={10} rx={170} ry={46} fill="#f4f1ea" {...P} />
      <ellipse cx={0} cy={6} rx={118} ry={28} fill="#e2ddd2" />
      {!vacio && (
        <g>
          <path d={`M-120,0 Q-110,${-h * 0.6} -40,${-h * 0.8} Q0,${-h * 1.05} 40,${-h * 0.8} Q110,${-h * 0.6} 120,0 Z`} fill="#e8c27a" {...P} />
          <path d={`M-90,-4 Q-60,${-h * 0.5} -10,${-h * 0.55} Q30,${-h * 0.4} 60,-4 Z`} fill="#8bc34a" {...P} />
          <path d={`M-30,${-h * 0.7} Q10,${-h * 0.9} 60,${-h * 0.6} Q50,${-h * 0.4} -10,${-h * 0.45} Z`} fill="#c2703d" {...P} />
          <ellipse cx={-50} cy={-h * 0.28} rx={26} ry={16} fill="#ffcf4a" {...P} />
          <ellipse cx={70} cy={-h * 0.3} rx={22} ry={14} fill="#e85a4a" {...P} />
        </g>
      )}
      {vacio && [[-60, -2], [30, 4], [70, -6]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={6} fill="#c2703d" stroke={INK} strokeWidth={3} />)}
    </g>
  );
};

/** Comedor: pared, cuadro, lámpara colgante, mesa con mantel, sillas, tapete. mesaY = altura de la cubierta */
export const Comedor: React.FC<{ mesaY?: number; tono?: number; hora?: number; reloj?: number; children?: React.ReactNode }> = ({ mesaY = 1300, tono = 0, hora = 0.6, reloj, children }) => {
  const f = useCurrentFrame();
  const pared = mix('#4a2a4a', '#6a3a2a', tono);
  return (
    <g>
      <rect x={-400} y={-300} width={1880} height={mesaY + 400} fill={pared} />
      {Array.from({ length: 14 }).map((_, i) => <rect key={i} x={-400 + i * 140} y={-300} width={60} height={mesaY + 400} fill="#000" opacity={0.07} />)}
      <rect x={-400} y={mesaY - 60} width={1880} height={30} fill="#3a1f2a" {...P} />
      <rect x={-400} y={mesaY + 100} width={1880} height={1000} fill="#2a1620" />
      <Ventana x={110} y={520} w={260} h={330} hora={hora} cortina="#7a3a5a" />
      {/* cuadro */}
      <g>
        <rect x={700} y={540} width={220} height={170} fill="#c8a060" {...P} />
        <rect x={720} y={560} width={180} height={130} fill="#3f6f8e" {...P} strokeWidth={4} />
        <path d="M720,690 L780,620 L820,660 L860,610 L900,690 Z" fill="#7ed957" {...P} strokeWidth={4} />
        <circle cx={860} cy={590} r={14} fill="#ffd23f" {...P} strokeWidth={3} />
      </g>
      {reloj !== undefined && <Reloj x={810} y={850} r={80} hora={reloj} />}
      {/* lámpara colgante */}
      <g transform={`rotate(${Math.sin(f / 40) * 2},540,-100)`}>
        <line x1={540} y1={-100} x2={540} y2={430} stroke={INK} strokeWidth={6} />
        <path d="M460,470 L620,470 L590,420 L490,420 Z" fill="#ffcf4a" {...P} />
        <ellipse cx={540} cy={480} rx={30} ry={14} fill="#fff6c0" {...P} strokeWidth={4} />
        <path d="M420,490 L660,490 L900,1240 L180,1240 Z" fill="#ffe8a0" opacity={0.08} />
      </g>
      {/* sillas detrás */}
      {[170, 910].map((cx) => (
        <g key={cx}>
          <rect x={cx - 70} y={mesaY - 330} width={140} height={340} rx={20} fill="#6b3f2a" {...P} />
          <rect x={cx - 46} y={mesaY - 300} width={92} height={200} rx={14} fill="#55301f" {...P} strokeWidth={4} />
        </g>
      ))}
      {children}
      {/* mesa con mantel */}
      <path d={`M-60,${mesaY} L1140,${mesaY} L1180,${mesaY + 300} Q1080,${mesaY + 340} 980,${mesaY + 300} Q880,${mesaY + 350} 780,${mesaY + 300} Q680,${mesaY + 350} 540,${mesaY + 300} Q400,${mesaY + 350} 300,${mesaY + 300} Q200,${mesaY + 350} 100,${mesaY + 300} Q0,${mesaY + 340} -100,${mesaY + 300} Z`} fill="#f2ebe0" {...P} />
      <path d={`M-60,${mesaY} L1140,${mesaY}`} stroke={INK} strokeWidth={SW} />
      {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={-40 + i * 140} y1={mesaY + 20} x2={-40 + i * 140} y2={mesaY + 300} stroke="#e05050" strokeWidth={10} opacity={0.5} />)}
      <rect x={-60} y={mesaY - 20} width={1200} height={20} fill="#8a5a3a" {...P} />
    </g>
  );
};

/** Recámara: pared, ventana con luna/lluvia, buró con lámpara, cama, tapete y pantuflas */
export const Recamara: React.FC<{ hora?: number; lluvia?: boolean; camaY?: number; children?: React.ReactNode; tono?: number }> = ({ hora = 2, lluvia = false, camaY = 1250, children, tono = 0 }) => {
  const pared = mix('#2a3a66', '#6a2a3a', tono);
  return (
    <g>
      <rect x={-400} y={-300} width={1880} height={2600} fill={pared} />
      {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={60 + (i % 3) * 420} cy={300 + Math.floor(i / 3) * 360} r={8} fill="#fff" opacity={0.08} />)}
      <rect x={-400} y={1500} width={1880} height={800} fill="#22243e" />
      <Ventana x={90} y={500} w={280} h={330} hora={hora} lluvia={lluvia} />
      <ellipse cx={540} cy={1760} rx={420} ry={90} fill="#7a3a5a" {...P} />
      {/* buró y lámpara */}
      <rect x={820} y={1180} width={220} height={300} rx={12} fill="#6b4a3a" {...P} />
      <rect x={846} y={1240} width={168} height={80} rx={8} fill="#55382c" {...P} strokeWidth={4} />
      <rect x={920} y={1060} width={22} height={120} fill="#4a3428" {...P} strokeWidth={4} />
      <path d="M870,1070 L990,1070 L960,980 L900,980 Z" fill="#ffcf4a" {...P} />
      {/* cama */}
      <path d={`M140,${camaY + 10} L140,${camaY - 330} Q140,${camaY - 400} 220,${camaY - 400} L860,${camaY - 400} Q940,${camaY - 400} 940,${camaY - 330} L940,${camaY + 10} Z`} fill="#8a5a3a" {...P} />
      {children}
      {/* pantuflas */}
      {[400, 500].map((x) => <ellipse key={x} cx={x} cy={1800} rx={44} ry={20} fill="#ed5446" {...P} strokeWidth={4} />)}
    </g>
  );
};

/** Sala de control dentro de la cabeza: paredes de pantallas, consola con botones y un gran interruptor. modo 0 alerta (rojo) → 1 calma (ámbar suave) */
export const SalaControl: React.FC<{ modo?: number; palanca?: number; children?: React.ReactNode; atenua?: number }> = ({ modo = 0, palanca = 0, children, atenua = 0 }) => {
  const f = useCurrentFrame();
  const luz = mix('#ff6a5a', '#ffc070', modo);
  return (
    <g>
      <rect x={-400} y={-300} width={1880} height={2600} fill={mix('#3a1a2a', '#2a2238', modo)} />
      {/* paredes curvas con pantallas */}
      <path d="M-200,300 Q540,140 1280,300 L1280,1400 L-200,1400 Z" fill={mix('#4a2234', '#3a2f4a', modo)} {...P} />
      {[[120, 520], [400, 450], [680, 450], [960, 520]].map(([sx, sy], i) => (
        <g key={i}>
          <rect x={sx - 110} y={sy} width={220} height={150} rx={18} fill="#14101c" {...P} />
          <rect x={sx - 94} y={sy + 16} width={188} height={118} rx={10} fill={mix('#3a0f18', '#1a3a3a', modo)} />
          {/* ondas en las pantallas (sin texto) */}
          <path d={Array.from({ length: 12 }).map((_, k) => `${k ? 'L' : 'M'}${sx - 84 + k * 15},${sy + 75 + Math.sin(k * 0.9 + f / (6 + modo * 10) + i) * (30 - modo * 18)}`).join(' ')}
            fill="none" stroke={luz} strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {/* luz ambiental */}
      <circle cx={540} cy={360} r={40} fill={luz} {...P} opacity={0.95} />
      <circle cx={540} cy={360} r={90 + Math.sin(f / (modo > 0.5 ? 20 : 3)) * 10} fill={luz} opacity={0.2} />
      <rect x={-400} y={1400} width={1880} height={900} fill="#1c1424" />
      {children}
      {/* consola */}
      <path d="M-100,1380 L1180,1380 L1180,1560 L-100,1560 Z" fill="#5a5f7a" {...P} />
      <path d="M-100,1560 L1180,1560 L1180,2300 L-100,2300 Z" fill="#3c3f55" {...P} />
      {Array.from({ length: 7 }).map((_, i) => {
        const on = (Math.floor(f / (modo > 0.5 ? 18 : 5)) + i * 2) % 4 < 2;
        const c = ['#ff6a5a', '#ffd23f', '#7ed957', '#6ec8ff'][i % 4];
        return <circle key={i} cx={90 + i * 95} cy={1470} r={26} fill={on ? c : mix(c, '#222', 0.6)} {...P} strokeWidth={5} />;
      })}
      {/* gran interruptor (arriba = alerta, abajo = descanso) */}
      <g transform="translate(900,1440)">
        <rect x={-80} y={-110} width={160} height={220} rx={26} fill="#2a2a3a" {...P} />
        <rect x={-44} y={-80 + palanca * 90} width={88} height={70} rx={16} fill={palanca > 0.5 ? '#7ed957' : '#ff6a5a'} {...P} />
        {/* ícono luna en la parte de abajo */}
        <path d="M-10,64 a24,24 0 1 0 24,24 a18,18 0 1 1 -24,-24 Z" fill="#ffe8a0" stroke={INK} strokeWidth={3} opacity={0.9} />
      </g>
      <rect x={-400} y={-300} width={1880} height={2600} fill="#0a0612" opacity={atenua} />
    </g>
  );
};
