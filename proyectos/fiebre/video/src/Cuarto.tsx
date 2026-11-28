import React from 'react';
import { useCurrentFrame } from 'remotion';
import { tone, Halo, Motes, rnd, mix } from './common';

/** Habitación. t: 0 frío azul · 1 calor rojo · 2 neutro ciruela */
export const Cuarto: React.FC<{ t: number; rain?: number; win?: number; wobble?: number; thermo?: number; flash?: boolean }> = ({ t, rain = 1, win = 0, wobble = 0, thermo = 0.4, flash = true }) => {
  const f = useCurrentFrame();
  const wallA = tone(t, '#0e3a78', '#7a1a1a', '#4a1740');
  const wallB = tone(t, '#06152e', '#2a0808', '#1c0b28');
  const light = tone(t, '#5fc8ff', '#ff7a2a', '#e8a8d8');
  const floorA = tone(t, '#0a2350', '#4a120c', '#2e1232');
  const wood = tone(t, '#1c2f5a', '#5a2414', '#3a1c34');
  const woodD = tone(t, '#0d1a3a', '#2e0e08', '#200d22');
  // relámpago ocasional en la ventana cuando hace frío
  const lf = (f % 150);
  const bolt = flash && t < 0.5 && lf > 60 && lf < 66 ? (lf % 2 ? 0.9 : 0.4) : 0;
  const sw = Math.sin(f / 3) * wobble;
  return (
    <g>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={wallA} /><stop offset="1" stopColor={wallB} /></linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={floorA} /><stop offset="1" stopColor={wallB} /></linearGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(tone(t, '#173a7a', '#3a1a3a', '#2a2050'), '#dff4ff', bolt)} />
          <stop offset="1" stopColor={mix(tone(t, '#061430', '#1a0a20', '#141028'), '#9fd8ff', bolt)} />
        </linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={light} stopOpacity=".28" /><stop offset="1" stopColor={light} stopOpacity="0" /></linearGradient>
        <clipPath id="winclip"><rect x={80} y={470} width={340} height={400} rx={14} /></clipPath>
        <pattern id="wallpaper" width="90" height="90" patternUnits="userSpaceOnUse">
          <circle cx="45" cy="45" r="3" fill="#fff" opacity=".06" /><circle cx="0" cy="0" r="2" fill="#fff" opacity=".05" />
        </pattern>
      </defs>
      <rect x={-400} y={-200} width={1880} height={1700} fill="url(#wall)" />
      <rect x={-400} y={-200} width={1880} height={1700} fill="url(#wallpaper)" />
      {/* zócalo y suelo */}
      <rect x={-400} y={1440} width={1880} height={700} fill="url(#floor)" />
      {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={-400 + i * 180} x2={-700 + i * 260} y1={1440} y2={2200} stroke="#000" strokeOpacity=".25" strokeWidth={3} />)}
      <rect x={-400} y={1420} width={1880} height={24} fill={wood} />
      {/* ventana con lluvia */}
      <rect x={66} y={456} width={368} height={428} rx={20} fill={woodD} />
      <rect x={80} y={470} width={340} height={400} rx={14} fill="url(#sky)" />
      <g clipPath="url(#winclip)">
        <circle cx={330} cy={560} r={46} fill={tone(t, '#dff4ff', '#ffd0a0', '#f0d8ff')} opacity={0.5} />
        {Array.from({ length: 46 }).map((_, i) => {
          const x = 80 + rnd(i) * 360;
          const y = 440 + ((f * (18 + rnd(i + 9) * 10) + rnd(i + 3) * 500) % 480);
          return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 34} stroke="#cfeeff" strokeWidth={2.5} opacity={0.55 * rain} />;
        })}
        {/* gotas resbalando por el vidrio */}
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 100 + rnd(i + 40) * 300; const y = 470 + ((f * (1.2 + rnd(i) * 2) + rnd(i + 2) * 400) % 400);
          return <circle key={i} cx={x} cy={y} r={5} fill="#dff4ff" opacity={0.5 * rain} />;
        })}
      </g>
      {/* hojas de la ventana (se abren hacia dentro) */}
      <g>
        <rect x={80} y={470} width={170 * (1 - win * 0.85)} height={400} fill="#cfeeff" opacity={0.06} stroke={woodD} strokeWidth={10} />
        <rect x={250 + 170 * win * 0.85} y={470} width={170 * (1 - win * 0.85)} height={400} fill="#cfeeff" opacity={0.06} stroke={woodD} strokeWidth={10} />
      </g>
      <rect x={60} y={870} width={380} height={26} rx={8} fill={wood} />
      {/* cortinas */}
      {[0, 1].map((side) => {
        const blow = win * (18 + Math.sin(f / 4 + side) * 10);
        const x0 = side ? 420 : 80;
        const dir = side ? 1 : -1;
        return (
          <path key={side} fill={tone(t, '#1f4f9a', '#a83a2a', '#6a2a6a')} opacity={0.9}
            d={`M${x0 + dir * 40},440 L${x0 - dir * 30},440 Q${x0 - dir * (10 - blow * 2)},700 ${x0 - dir * (40 - blow * 3)},${960 - blow * 2} L${x0 + dir * 50},960 Q${x0 + dir * 30},700 ${x0 + dir * 40},440 Z`} />
        );
      })}
      <rect x={20} y={430} width={460} height={16} rx={8} fill={woodD} />
      {/* haz de luz de la ventana */}
      <polygon points={`80,470 420,470 980,1500 200,1600`} fill="url(#beam)" opacity={0.8 + bolt} />
      {/* cuadro en la pared */}
      <g transform={`rotate(${sw * 3},800,540)`}>
        <line x1={800} y1={540} x2={740} y2={600} stroke={woodD} strokeWidth={3} />
        <line x1={800} y1={540} x2={860} y2={600} stroke={woodD} strokeWidth={3} />
        <rect x={710} y={596} width={180} height={150} rx={10} fill={woodD} />
        <rect x={724} y={610} width={152} height={122} rx={6} fill={tone(t, '#0b2a5a', '#4a1a10', '#2a1236')} />
        <path d="M724,732 L780,664 L816,700 L846,672 L876,732 Z" fill={light} opacity={0.4} />
        <circle cx={850} cy={640} r={12} fill={light} opacity={0.6} />
      </g>
      {/* mesita de noche, lámpara y termómetro */}
      <g transform={`translate(0,${Math.abs(sw) * -4})`}>
        <rect x={830} y={1230} width={230} height={260} rx={14} fill={wood} stroke={woodD} strokeWidth={6} />
        <rect x={850} y={1300} width={190} height={70} rx={8} fill={woodD} />
        <circle cx={945} cy={1335} r={8} fill={light} opacity={0.7} />
        <g transform={`rotate(${sw * 4},950,1230)`}>
          <Halo x={950} y={1090} r={190} color={tone(t, '#7fd0ff', '#ffb050', '#ffc8a0')} o={0.55} />
          <rect x={940} y={1130} width={20} height={100} fill={woodD} />
          <ellipse cx={950} cy={1226} rx={50} ry={10} fill={woodD} />
          <path d="M890,1135 L1010,1135 L985,1045 L915,1045 Z" fill={tone(t, '#8fd8ff', '#ffc070', '#f4c8b0')} opacity={0.95} />
        </g>
        {/* vaso de agua */}
        <rect x={860} y={1176} width={36} height={54} rx={6} fill="#cfeeff" opacity={0.35} stroke="#e8fbff" strokeWidth={2} />
        {/* termómetro (sin números) */}
        <g transform={`translate(912,1222) rotate(${-8 + sw * 6})`}>
          <rect x={0} y={-10} width={110} height={18} rx={9} fill="#e8fbff" opacity={0.85} />
          <rect x={8} y={-4} width={86 * thermo} height={6} rx={3} fill="#ff3a3a" />
          <circle cx={4} cy={-1} r={11} fill="#ff3a3a" />
        </g>
      </g>
      <Motes color={light} n={22} o={0.45} />
    </g>
  );
};

const plaid = (id: string, base: string, line: string) => (
  <pattern id={id} width="70" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
    <rect width="70" height="70" fill={base} />
    <rect x="0" y="26" width="70" height="16" fill={line} opacity=".55" />
    <rect x="26" y="0" width="16" height="70" fill={line} opacity=".55" />
    <rect x="0" y="32" width="70" height="4" fill="#000" opacity=".2" />
  </pattern>
);

/** Cama: cabecera + almohada + colchón. La almohada se puede mover (pillow transform). */
export const Cama: React.FC<{ t: number; pillow?: string; showPillow?: boolean }> = ({ t, pillow = '', showPillow = true }) => {
  const wood = tone(t, '#22386a', '#6a2c18', '#43203c');
  const woodD = tone(t, '#101e40', '#34110a', '#24102a');
  const sheet = tone(t, '#6f8fc8', '#e8a888', '#b89ab8');
  return (
    <g>
      <path d="M140,1260 L140,960 Q140,880 220,880 L860,880 Q940,880 940,960 L940,1260 Z" fill={wood} stroke={woodD} strokeWidth={10} />
      {[260, 400, 540, 680, 820].map((x) => <rect key={x} x={x - 22} y={930} width={44} height={290} rx={18} fill={woodD} opacity={0.6} />)}
      <rect x={100} y={1250} width={880} height={260} rx={30} fill={sheet} />
      <rect x={100} y={1470} width={880} height={300} rx={24} fill={woodD} />
      <rect x={70} y={1700} width={60} height={160} rx={12} fill={wood} />
      <rect x={950} y={1700} width={60} height={160} rx={12} fill={wood} />
      {showPillow && (
        <g transform={pillow}>
          <path d="M330,1060 Q330,1010 400,1015 L680,1015 Q750,1010 750,1060 L752,1190 Q750,1232 680,1228 L400,1228 Q330,1232 328,1190 Z" fill={tone(t, '#cfe0ff', '#ffe0d0', '#f0e0f0')} />
          <path d="M360,1050 Q540,1030 720,1050" stroke="#fff" strokeOpacity=".5" strokeWidth={6} fill="none" />
        </g>
      )}
    </g>
  );
};

/** Almohada suelta (para abanicarse) centrada en (0,0) */
export const Almohada: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <path d="M-200,-60 Q-205,-110 -140,-105 L140,-105 Q205,-110 200,-60 L202,60 Q205,110 140,105 L-140,105 Q-205,110 -202,60 Z" fill={tone(t, '#cfe0ff', '#ffe0d0', '#f0e0f0')} />
    <path d="M-170,-70 Q0,-90 170,-70" stroke="#fff" strokeOpacity=".5" strokeWidth={6} fill="none" />
  </g>
);

export const COBIJAS = ['#2b4fa8', 'plaid', '#d8c8a0', '#6a3aa8'];

/** Cobija suelta (path relativo al origen), para lanzarla o tirarla al suelo */
export const Cobija: React.FC<{ kind: number; t: number; w?: number; h?: number }> = ({ kind, t, w = 520, h = 300 }) => {
  const id = 'pl' + kind + Math.round(w);
  const base = kind === 1 ? `url(#${id})` : tone(t, COBIJAS[kind] === 'plaid' ? '#a8323a' : COBIJAS[kind], mix(COBIJAS[kind] === 'plaid' ? '#a8323a' : COBIJAS[kind], '#ff8040', 0.35), COBIJAS[kind] === 'plaid' ? '#a8323a' : COBIJAS[kind]);
  return (
    <g>
      <defs>{plaid(id, tone(t, '#8a2a3a', '#c83a2a', '#a8323a'), '#f0d8c0')}</defs>
      <path d={`M${-w / 2},${-h / 2 + 20} Q${-w / 4},${-h / 2 - 20} 0,${-h / 2 + 10} Q${w / 4},${-h / 2 + 30} ${w / 2},${-h / 2} L${w / 2 + 20},${h / 2 - 20} Q${w / 4},${h / 2 + 20} 0,${h / 2} Q${-w / 4},${h / 2 - 10} ${-w / 2 - 10},${h / 2} Z`}
        fill={base} stroke="#000" strokeOpacity=".25" strokeWidth={4} />
      <path d={`M${-w / 2 + 30},${-h / 2 + 50} Q0,${-h / 2 + 30} ${w / 2 - 20},${-h / 2 + 40}`} stroke="#fff" strokeOpacity=".2" strokeWidth={8} fill="none" />
    </g>
  );
};

/**
 * Las cobijas sobre el cuerpo acostado. n = cuántas siguen encima (0-4),
 * off[k] = desplazamiento de salida (para arrancarlas), extra = 4.ª cobija subiendo (0-1).
 */
export const Cobijas: React.FC<{ t: number; n?: number; lift?: number[]; extra?: number; jig?: number; dy?: number }> = ({ t, n = 3, lift = [0, 0, 0], extra = 0, jig = 0, dy = 0 }) => {
  const f = useCurrentFrame();
  const layers = [
    { top: 1185, kind: 2 },
    { top: 1215, kind: 1 },
    { top: 1250, kind: 0 },
  ];
  return (
    <g transform={`translate(0,${dy})`}>
      <defs>{plaid('plaidBed', tone(t, '#8a2a3a', '#c83a2a', '#a8323a'), '#f0d8c0')}</defs>
      {layers.slice(0, n).map((L, i) => {
        const fill = L.kind === 1 ? 'url(#plaidBed)' : tone(t, COBIJAS[L.kind], mix(COBIJAS[L.kind], '#ff7040', 0.4), COBIJAS[L.kind]);
        const j = Math.sin(f * 2.1 + i) * jig;
        const off = lift[i] || 0;
        return (
          <g key={i} transform={`translate(${off * 700},${-off * 500 + j}) rotate(${off * 40},540,1400)`} opacity={1 - Math.max(0, off - 0.8) * 5}>
            <path d={`M110,${L.top + 70} Q120,${L.top} 300,${L.top + 10} Q540,${L.top - 30} 780,${L.top + 10} Q960,${L.top} 970,${L.top + 70} L990,1780 L90,1780 Z`}
              fill={fill} stroke="#000" strokeOpacity=".25" strokeWidth={5} />
            <path d={`M150,${L.top + 40} Q540,${L.top - 10} 930,${L.top + 40}`} stroke="#fff" strokeOpacity=".22" strokeWidth={10} fill="none" />
            <path d={`M300,${L.top + 160} Q420,${L.top + 260} 380,${L.top + 420} M720,${L.top + 150} Q640,${L.top + 280} 700,${L.top + 430}`} stroke="#000" strokeOpacity=".18" strokeWidth={14} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      {extra > 0 && (
        <g transform={`translate(0,${(1 - extra) * 700})`}>
          <path d="M90,1180 Q120,1120 300,1130 Q540,1100 780,1130 Q960,1120 990,1180 L1010,1800 L70,1800 Z" fill={tone(t, '#5a3aa8', '#a8406a', '#6a3aa8')} stroke="#000" strokeOpacity=".3" strokeWidth={5} />
          <path d="M140,1160 Q540,1110 940,1160" stroke="#fff" strokeOpacity=".25" strokeWidth={10} fill="none" />
        </g>
      )}
    </g>
  );
};
