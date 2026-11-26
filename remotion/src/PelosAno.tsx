import React from 'react';
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';

// ¿Por qué tenemos pelos en el ano? — explicativo cartoon 9:16
// Elenco (código de color fijo):
//   Pelitos (defensores): trazo negro ondulado, ojos grandes, casco AZUL
//   Rozamiento (enemigo): ROJO con dientes
//   Nubes de olor (especialistas): LILA con gafas de sol
//   Cuchilla (enemigo 2): gris metálico con dientes ROJOS
//   Ayudante / acierto: VERDE LIMA

export const FPS = 30;
export const DURACION = 46 * FPS;

const ROJO = '#e8342a';
const AZUL = '#1f5bff';
const LIMA = '#b6ef2e';
const LILA = '#b48cff';
const AMARILLO = '#ffcf1f';
const CREMA = '#fff3dc';
const PIEL = '#ffb38a';
const PIEL_SOMBRA = '#f0906a';
const TINTA = '#1a1010';
const FUENTE = '"Inter Display", Inter, sans-serif';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const s = (seg: number) => Math.round(seg * FPS);

// ---------------- subtítulos ----------------
type Frase = { t0: number; t1: number; texto: string; clave: string[] };
const FRASES: Frase[] = [
  { t0: 0.3, t1: 3.0, texto: '¿POR QUÉ TENEMOS PELOS EN EL ANO?', clave: ['PELOS', 'ANO?'] },
  { t0: 3.0, t1: 5.5, texto: 'SPOILER: NO ES UN ERROR DE FÁBRICA', clave: ['ERROR'] },
  { t0: 5.5, t1: 8.5, texto: 'SON PELOS PERIANALES Y TIENEN TRABAJO', clave: ['PERIANALES', 'TRABAJO'] },
  { t0: 8.5, t1: 11.5, texto: 'TRABAJO NÚMERO 1: FRENAR EL ROCE', clave: ['ROCE'] },
  { t0: 11.5, t1: 15.0, texto: 'CADA VEZ QUE CAMINAS, TUS NALGAS SE FROTAN', clave: ['FROTAN'] },
  { t0: 15.0, t1: 19.0, texto: 'LOS PELOS HACEN DE COJINETE Y EVITAN IRRITACIONES', clave: ['COJINETE'] },
  { t0: 19.0, t1: 22.5, texto: 'TRABAJO NÚMERO 2: GUARDAR TU OLOR', clave: ['OLOR'] },
  { t0: 22.5, t1: 26.0, texto: 'AHÍ HAY GLÁNDULAS QUE SUELTAN SUDOR Y SEÑALES QUÍMICAS', clave: ['GLÁNDULAS', 'QUÍMICAS'] },
  { t0: 26.0, t1: 29.5, texto: 'LOS PELOS LAS ATRAPAN, COMO UNA FIRMA PERSONAL', clave: ['FIRMA'] },
  { t0: 29.5, t1: 33.0, texto: 'SI LOS RASURAS, LLEGAN LOS PROBLEMAS', clave: ['RASURAS,'] },
  { t0: 33.0, t1: 36.5, texto: 'PICOR, IRRITACIÓN Y PELOS ENCARNADOS', clave: ['PICOR,', 'ENCARNADOS'] },
  { t0: 36.5, t1: 40.0, texto: '¿TE MOLESTAN? MEJOR RECORTA, NO RASURES', clave: ['RECORTA,'] },
  { t0: 40.0, t1: 43.0, texto: 'Y AHORA YA SABES POR QUÉ ESTÁN AHÍ', clave: ['AHÍ'] },
];

const Subtitulos: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const fr = FRASES.find((x) => t >= x.t0 && t < x.t1);
  if (!fr) return null;
  const palabras = fr.texto.split(' ');
  const lect = (fr.t1 - fr.t0) * 0.8; // las palabras "se dicen" en el 80 % de la frase
  const entrada = interpolate(t, [fr.t0, fr.t0 + 0.15], [0, 1], clamp);
  return (
    <div style={{
      position: 'absolute', top: 150, left: 70, right: 70, textAlign: 'center', fontFamily: FUENTE,
      fontWeight: 900, fontSize: 74, lineHeight: 1.08, letterSpacing: -1, opacity: entrada,
      transform: `translateY(${(1 - entrada) * -14}px)`,
    }}>
      {palabras.map((p, i) => {
        const ti = fr.t0 + (lect * i) / palabras.length;
        const tsig = fr.t0 + (lect * (i + 1)) / palabras.length;
        const visible = t >= ti - 0.02;
        const activa = t < tsig || i === palabras.length - 1;
        const esClave = fr.clave.includes(p);
        const color = esClave ? ROJO : activa ? '#ffffff' : '#c9c2c2';
        return (
          <span key={i} style={{
            color, opacity: visible ? 1 : 0, display: 'inline-block', marginRight: 18,
            WebkitTextStroke: `7px ${TINTA}`, paintOrder: 'stroke fill',
            textShadow: `0 7px 0 ${TINTA}`,
          }}>{p}</span>
        );
      })}
    </div>
  );
};

// ---------------- piezas comunes ----------------
const Trama: React.FC<{ color?: string; op?: number; tam?: number }> = ({ color = '#000', op = 0.14, tam = 16 }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <pattern id={`dots-${tam}-${color}`} width={tam} height={tam} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx={tam / 2} cy={tam / 2} r={tam * 0.22} fill={color} />
      </pattern>
      <radialGradient id={`vig-${tam}`} cx="50%" cy="55%" r="70%">
        <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#fff" stopOpacity="1" />
      </radialGradient>
      <mask id={`m-${tam}-${color}`}><rect width={1080} height={1920} fill={`url(#vig-${tam})`} /></mask>
    </defs>
    <rect width={1080} height={1920} fill={`url(#dots-${tam}-${color})`} opacity={op} />
    <rect width={1080} height={1920} fill={`url(#dots-${tam}-${color})`} opacity={op * 1.6} mask={`url(#m-${tam}-${color})`} />
  </svg>
);

const Fondo: React.FC<{ color: string; trama?: string; children?: React.ReactNode }> = ({ color, trama = '#000', children }) => (
  <AbsoluteFill style={{ background: color, overflow: 'hidden' }}>
    <Trama color={trama} />
    {children}
  </AbsoluteFill>
);

const Ojos: React.FC<{ x: number; y: number; r?: number; mira?: number; enfado?: boolean; parpadeo?: number }> = ({ x, y, r = 14, mira = 0, enfado, parpadeo = 1 }) => (
  <g>
    {[-1, 1].map((l) => (
      <g key={l}>
        <ellipse cx={x + l * r * 1.15} cy={y} rx={r} ry={r * 1.15 * parpadeo} fill="#fff" stroke={TINTA} strokeWidth={4} />
        <circle cx={x + l * r * 1.15 + mira * r * 0.4} cy={y + 2} r={r * 0.48 * Math.min(1, parpadeo * 1.5)} fill={TINTA} />
        {enfado && <path d={`M${x + l * r * 2.1},${y - r * 1.5} L${x + l * r * 0.2},${y - r * 0.7}`} stroke={TINTA} strokeWidth={7} strokeLinecap="round" />}
      </g>
    ))}
  </g>
);

// Pelito: personaje defensor
const Pelito: React.FC<{ alto?: number; fase?: number; casco?: boolean; saludo?: number; color?: string; triste?: boolean }> = ({ alto = 260, fase = 0, casco = true, saludo = 0, color = TINTA, triste }) => {
  const f = useCurrentFrame();
  const w = Math.sin((f + fase * 37) / 9) * 10;
  const parp = (f + fase * 53) % 90 < 4 ? 0.15 : 1;
  const h = alto;
  const d = `M60,${h} C${40 + w},${h * 0.75} ${85 + w},${h * 0.55} ${60 + w * 1.4},${h * 0.35} C${40 + w * 1.6},${h * 0.2} ${70 + w * 1.8},${h * 0.1} ${60 + w * 2},60`;
  const hx = 60 + w * 2;
  return (
    <svg width={120} height={h + 20} viewBox={`0 0 120 ${h + 20}`} style={{ overflow: 'visible' }}>
      <path d={d} stroke={color} strokeWidth={16} fill="none" strokeLinecap="round" />
      <circle cx={hx} cy={52} r={34} fill={color} />
      <Ojos x={hx} y={52} r={11} parpadeo={parp} />
      {triste
        ? <path d={`M${hx - 10},80 Q${hx},72 ${hx + 10},80`} stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
        : <path d={`M${hx - 10},74 Q${hx},84 ${hx + 10},74`} stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />}
      {casco && (
        <g>
          <path d={`M${hx - 38},34 Q${hx},-14 ${hx + 38},34 Z`} fill={AZUL} stroke={TINTA} strokeWidth={5} />
          <rect x={hx - 44} y={30} width={88} height={10} rx={5} fill={AZUL} stroke={TINTA} strokeWidth={4} />
          <path d={`M${hx - 16},16 Q${hx - 6},2 ${hx + 8},6`} stroke="#9fc0ff" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      )}
      {saludo > 0 && (
        <path d={`M${hx + 20},${h * 0.45} Q${hx + 60},${h * 0.35 - 40 * saludo} ${hx + 34},${50 - 10 * saludo}`} stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
};

// Rozamiento: enemigo rojo con dientes
const Rozon: React.FC<{ tam?: number; mareo?: number }> = ({ tam = 260, mareo = 0 }) => {
  const f = useCurrentFrame();
  const pts = Array.from({ length: 18 }).map((_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = i % 2 ? 100 : 128 + Math.sin(f / 4 + i) * 6;
    return `${150 + Math.cos(a) * r},${150 + Math.sin(a) * r}`;
  }).join(' ');
  return (
    <svg width={tam} height={tam} viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
      <polygon points={pts} fill={ROJO} stroke={TINTA} strokeWidth={8} strokeLinejoin="round" />
      <circle cx={150} cy={150} r={96} fill="#ff5a4a" />
      <circle cx={122} cy={120} r={26} fill="#ff8a7c" opacity={0.6} />
      {mareo > 0
        ? [-1, 1].map((l) => <text key={l} x={150 + l * 34} y={140} textAnchor="middle" fontSize={44} fontWeight={900} fill={TINTA} fontFamily={FUENTE}>@</text>)
        : <Ojos x={150} y={124} r={20} enfado mira={Math.sin(f / 10)} />}
      <path d="M92,178 Q150,236 208,178 Z" fill={TINTA} />
      <path d="M96,180 L112,198 L126,184 L140,202 L154,186 L168,202 L182,186 L196,198 L206,180 Z" fill="#fff" />
    </svg>
  );
};

// Nube de olor: especialista lila con gafas de sol
const NubeOlor: React.FC<{ tam?: number; fase?: number }> = ({ tam = 200, fase = 0 }) => {
  const f = useCurrentFrame();
  const b = Math.sin((f + fase * 20) / 8) * 4;
  return (
    <svg width={tam} height={tam * 0.75} viewBox="0 0 200 150" style={{ overflow: 'visible' }}>
      <path d={`M40,${120 + b} C5,120 5,72 40,70 C38,30 92,22 104,52 C118,22 170,30 162,72 C198,72 196,122 160,${120 - b} Z`} fill={LILA} stroke={TINTA} strokeWidth={6} />
      <path d="M50,62 C56,46 76,42 86,52" stroke="#e2d4ff" strokeWidth={7} fill="none" strokeLinecap="round" />
      <rect x={58} y={78} width={36} height={20} rx={8} fill={TINTA} />
      <rect x={106} y={78} width={36} height={20} rx={8} fill={TINTA} />
      <path d="M94,84 L106,84" stroke={TINTA} strokeWidth={5} />
      <path d="M86,108 Q100,118 114,108" stroke={TINTA} strokeWidth={5} fill="none" strokeLinecap="round" />
    </svg>
  );
};

// Trasero cartoon (melocotón)
const Trasero: React.FC<{ ancho?: number; separacion?: number; pelos?: boolean }> = ({ ancho = 640, separacion = 0, pelos = true }) => (
  <svg width={ancho} height={ancho * 0.85} viewBox="0 0 640 540" style={{ overflow: 'visible' }}>
    <ellipse cx={320} cy={520} rx={250} ry={22} fill="#000" opacity={0.25} />
    {[-1, 1].map((l) => (
      <g key={l} transform={`translate(${l * separacion},0)`}>
        <ellipse cx={320 + l * 140} cy={300} rx={170} ry={200} fill={PIEL} stroke={TINTA} strokeWidth={10} />
        <ellipse cx={320 + l * 190} cy={360} rx={80} ry={100} fill={PIEL_SOMBRA} opacity={0.45} />
        <ellipse cx={320 + l * 100} cy={210} rx={46} ry={30} fill="#fff" opacity={0.45} />
      </g>
    ))}
    {pelos && [0, 1, 2, 3, 4].map((i) => (
      <path key={i} d={`M${312 + (i % 2) * 14},${250 + i * 40} q${i % 2 ? 18 : -18},-8 ${i % 2 ? 6 : -8},-26`} stroke={TINTA} strokeWidth={6} fill="none" strokeLinecap="round" />
    ))}
    <path d="M150,110 Q320,60 490,110" stroke="#fff" strokeWidth={60} fill="none" strokeLinecap="round" />
    <path d="M150,110 Q320,60 490,110" stroke={TINTA} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray="0 0" opacity={0} />
  </svg>
);

const Lupa: React.FC<{ tam?: number }> = ({ tam = 360 }) => (
  <svg width={tam} height={tam} viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
    <rect x={190} y={190} width={36} height={130} rx={16} transform="rotate(-45 208 255)" fill="#7a3b1a" stroke={TINTA} strokeWidth={8} />
    <circle cx={130} cy={130} r={104} fill="rgba(200,235,255,.25)" stroke={TINTA} strokeWidth={16} />
    <circle cx={130} cy={130} r={104} fill="none" stroke={AMARILLO} strokeWidth={8} />
    <path d="M70,96 Q90,60 130,56" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" />
  </svg>
);

const Etiqueta: React.FC<{ texto: string; color?: string; fondo?: string; tam?: number; rot?: number }> = ({ texto, color = '#fff', fondo = TINTA, tam = 44, rot = 0 }) => (
  <div style={{
    display: 'inline-block', background: fondo, color, fontFamily: FUENTE, fontWeight: 900, fontSize: tam,
    padding: '10px 26px', borderRadius: 14, border: `6px solid ${TINTA}`, transform: `rotate(${rot}deg)`,
    boxShadow: `0 8px 0 ${TINTA}`, letterSpacing: 0.5, whiteSpace: 'nowrap',
  }}>{texto}</div>
);

const Esquinas: React.FC<{ x: number; y: number; w: number; h: number; color?: string; prog?: number }> = ({ x, y, w, h, color = AMARILLO, prog = 1 }) => {
  const l = 70;
  const sc = interpolate(prog, [0, 1], [1.3, 1]);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: prog }}>
      <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${sc}) translate(${-x - w / 2} ${-y - h / 2})`} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round">
        <path d={`M${x},${y + l} L${x},${y} L${x + l},${y}`} />
        <path d={`M${x + w - l},${y} L${x + w},${y} L${x + w},${y + l}`} />
        <path d={`M${x},${y + h - l} L${x},${y + h} L${x + l},${y + h}`} />
        <path d={`M${x + w - l},${y + h} L${x + w},${y + h} L${x + w},${y + h - l}`} />
      </g>
    </svg>
  );
};

const Pop: React.FC<{ desde: number; children: React.ReactNode; style?: React.CSSProperties; damping?: number }> = ({ desde, children, style, damping = 10 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: f - desde, fps, config: { damping } });
  return <div style={{ position: 'absolute', transform: `scale(${k})`, opacity: k > 0.01 ? 1 : 0, ...style }}>{children}</div>;
};

const Chispas: React.FC<{ x: number; y: number; n?: number; activo?: number }> = ({ x, y, n = 10, activo = 1 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: activo }}>
      {Array.from({ length: n }).map((_, i) => {
        const ciclo = (f * 1.3 + i * 7) % 18;
        const a = (i / n) * Math.PI * 2 + Math.floor((f + i * 7) / 18);
        const r1 = 30 + ciclo * 12;
        const r2 = r1 + 40;
        return <path key={i} d={`M${x + Math.cos(a) * r1},${y + Math.sin(a) * r1} L${x + Math.cos(a) * r2},${y + Math.sin(a) * r2}`}
          stroke={i % 2 ? AMARILLO : '#fff'} strokeWidth={10} strokeLinecap="round" opacity={1 - ciclo / 18} />;
      })}
    </svg>
  );
};

// ---------------- escenas ----------------
const EscenaGancho: React.FC<{ cierre?: boolean }> = ({ cierre }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(f, [0, s(5.5)], [1, 1.12]);
  const lupaX = interpolate(f, [0, s(2.2)], [900, 360], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const lupaY = 860 + Math.sin(f / 12) * 16;
  const sello = spring({ frame: f - s(3.4), fps, config: { damping: 9, mass: 0.7 } });
  const tache = interpolate(f, [s(4.3), s(4.8)], [0, 1], clamp);
  return (
    <Fondo color="#3a0808" trama="#ff3b2e">
      <AbsoluteFill style={{ background: 'radial-gradient(60% 40% at 50% 58%, rgba(255,70,50,.45), transparent 70%)' }} />
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <div style={{ position: 'absolute', left: 220, top: 820 }}><Trasero ancho={640} /></div>
        {!cierre && <div style={{ position: 'absolute', left: lupaX, top: lupaY }}><Lupa tam={380} /></div>}
      </AbsoluteFill>
      {!cierre && f > s(3.3) && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', transform: `scale(${sello}) rotate(-8deg)` }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <Etiqueta texto="¿ERROR DE FÁBRICA?" fondo={AMARILLO} color={TINTA} tam={64} />
            <svg width={700} height={200} style={{ position: 'absolute', left: -40, top: -40, overflow: 'visible' }}>
              <path d="M40,40 L640,170" stroke={ROJO} strokeWidth={26} strokeLinecap="round" strokeDasharray={640} strokeDashoffset={640 * (1 - tache)} />
              <path d="M640,40 L40,170" stroke={ROJO} strokeWidth={26} strokeLinecap="round" strokeDasharray={640} strokeDashoffset={640 * (1 - tache)} />
            </svg>
          </div>
        </div>
      )}
      {cierre && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1580, display: 'flex', justifyContent: 'center', gap: 20 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Pop key={i} desde={10 + i * 4} style={{ position: 'relative' }}><Pelito alto={170} fase={i} saludo={1} /></Pop>
          ))}
        </div>
      )}
    </Fondo>
  );
};

const EscenaPresentacion: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const x = [100, 300, 500, 700];
  const etq = spring({ frame: f - 30, fps, config: { damping: 12 } });
  const t2 = s(3.0); // "TRABAJO Nº1"
  const villano = interpolate(f, [t2 + 10, t2 + 35], [1300, 640], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const susto = interpolate(f, [t2 + 30, t2 + 40], [0, 1], clamp);
  return (
    <Fondo color={CREMA} trama="#e08a3a">
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 520, background: PIEL, borderTop: `10px solid ${TINTA}` }} />
      <Trama color="#c25a30" op={0.12} tam={20} />
      {x.map((xx, i) => (
        <Pop key={i} desde={4 + i * 6} style={{ left: xx + (i > 1 ? 120 : 0) * susto * 0, top: 1060 - i * 10, transformOrigin: 'bottom center' }}>
          <div style={{ transform: `translateX(${-susto * 30}px) rotate(${-susto * 8}deg)`, transformOrigin: 'bottom center' }}>
            <Pelito alto={340 + (i % 2) * 40} fase={i} saludo={interpolate(f, [40 + i * 4, 52 + i * 4], [0, 1], clamp) * (1 - susto)} />
          </div>
        </Pop>
      ))}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', transform: `scale(${etq}) rotate(-3deg)` }}>
        <Etiqueta texto="PELOS PERIANALES" fondo={AZUL} tam={58} />
      </div>
      {f > t2 && (
        <>
          <div style={{ position: 'absolute', left: villano, top: 1020, transform: `rotate(${Math.sin(f / 3) * 6}deg)` }}><Rozon tam={340} /></div>
          <Pop desde={t2} style={{ left: 0, right: 0, top: 560, textAlign: 'center' }}>
            <Etiqueta texto="TRABAJO Nº 1" fondo={ROJO} tam={66} rot={4} />
          </Pop>
        </>
      )}
    </Fondo>
  );
};

const EscenaRoce: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tCoj = s(3.5); // empieza "COJINETE"
  const coj = spring({ frame: f - tCoj, fps, config: { damping: 11 } });
  const paso = Math.sin(f / 5);
  const sep = 8 + 30 * coj;
  const roces = Math.floor(interpolate(f, [0, tCoj], [0, 3120], { ...clamp, easing: Easing.in(Easing.quad) }));
  const fueraVillano = interpolate(f, [tCoj + 6, tCoj + 30], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <Fondo color={AMARILLO} trama="#d8860a">
      <AbsoluteFill style={{ background: 'radial-gradient(50% 35% at 50% 58%, rgba(255,255,255,.55), transparent 70%)' }} />
      <div style={{ position: 'absolute', left: 220, top: 760 + Math.abs(paso) * -18 }}>
        <svg width={640} height={560} viewBox="0 0 640 560" style={{ overflow: 'visible' }}>
          {[-1, 1].map((l) => {
            const dy = l * paso * 26 * (1 - coj * 0.6);
            return (
              <g key={l} transform={`translate(${l * sep},${dy})`}>
                <ellipse cx={320 + l * 140} cy={300} rx={170} ry={200} fill={PIEL} stroke={TINTA} strokeWidth={10} />
                <ellipse cx={320 + l * 190} cy={360} rx={80} ry={100} fill={PIEL_SOMBRA} opacity={0.45} />
                <ellipse cx={320 + l * 100} cy={210} rx={46} ry={30} fill="#fff" opacity={0.45} />
              </g>
            );
          })}
          {/* zona roja de irritación antes del cojinete */}
          <ellipse cx={320} cy={320} rx={40} ry={150} fill={ROJO} opacity={0.55 * (1 - coj)} />
        </svg>
      </div>
      {/* pelitos cojinete entre las nalgas */}
      {coj > 0.02 && [0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: 480 + (i - 1) * 4, top: 820 + i * 130, transform: `scale(${coj * 0.55})`, transformOrigin: 'center' }}>
          <Pelito alto={220} fase={i + 3} />
        </div>
      ))}
      <Chispas x={540} y={1060} n={12} activo={1 - coj} />
      <div style={{ position: 'absolute', left: interpolate(fueraVillano, [0, 1], [700, 1300]), top: 620 - fueraVillano * 300, transform: `rotate(${fueraVillano * 540}deg)` }}>
        <Rozon tam={260} mareo={fueraVillano > 0 ? 1 : 0} />
      </div>
      {/* marcador de roces */}
      <div style={{ position: 'absolute', left: 80, top: 520, transform: `rotate(-4deg)` }}>
        <div style={{ background: TINTA, color: ROJO, fontFamily: '"DejaVu Sans Mono", monospace', fontWeight: 900, fontSize: 92, padding: '10px 30px', borderRadius: 18, border: `6px solid #fff`, boxShadow: `0 10px 0 ${TINTA}` }}>
          {roces.toLocaleString('es-ES')}
        </div>
        <div style={{ fontFamily: FUENTE, fontWeight: 900, fontSize: 40, color: TINTA, marginTop: 14 }}>ROCES HOY</div>
      </div>
      {/* círculo lima en el cojinete */}
      {coj > 0.05 && (
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <ellipse cx={540} cy={1060} rx={150} ry={260} fill="none" stroke={LIMA} strokeWidth={16} strokeDasharray={1400} strokeDashoffset={1400 * (1 - coj)} />
        </svg>
      )}
      <Pop desde={tCoj + 12} style={{ left: 640, top: 1380 }}><Etiqueta texto="COJINETE ✓" fondo={LIMA} color={TINTA} tam={50} rot={-5} /></Pop>
      <Pop desde={6} style={{ left: 640, top: 600 }}><Etiqueta texto="ROZAMIENTO" fondo={ROJO} tam={40} rot={6} /></Pop>
    </Fondo>
  );
};

const EscenaOlor: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tGland = s(3.5);
  const tFirma = s(7.0);
  const firma = spring({ frame: f - tFirma, fps, config: { damping: 12 } });
  const nubes = [0, 1, 2, 3, 4];
  return (
    <Fondo color={AZUL} trama="#000">
      <AbsoluteFill style={{ background: 'radial-gradient(55% 40% at 50% 70%, rgba(120,190,255,.6), transparent 70%)' }} />
      {/* piel con glándulas */}
      <div style={{ position: 'absolute', left: -20, right: -20, bottom: -10, height: 420, background: PIEL, borderTop: `10px solid ${TINTA}`, borderRadius: '50% 50% 0 0 / 60px 60px 0 0' }} />
      {[180, 540, 900].map((gx, i) => (
        <Pop key={gx} desde={tGland + i * 5} style={{ left: gx - 70, top: 1620 }}>
          <svg width={140} height={120} viewBox="0 0 140 120">
            <ellipse cx={70} cy={60} rx={62} ry={48} fill="#e36ad1" stroke={TINTA} strokeWidth={7} />
            <Ojos x={70} y={52} r={12} />
            <path d="M58,82 Q70,92 82,82" stroke={TINTA} strokeWidth={5} fill="none" strokeLinecap="round" />
          </svg>
        </Pop>
      ))}
      {f > tGland - 1 && <Pop desde={tGland + 14} style={{ left: 40, top: 1500 }}><Etiqueta texto="GLÁNDULAS APOCRINAS" fondo="#e36ad1" tam={36} rot={-3} /></Pop>}
      {/* pelitos-antena */}
      {[230, 430, 630, 830].map((px, i) => (
        <Pop key={px} desde={2 + i * 4} style={{ left: px - 60, top: 1080 - (i % 2) * 40, transformOrigin: 'bottom center' }}>
          <Pelito alto={420} fase={i + 1} />
        </Pop>
      ))}
      {/* nubes de olor que suben y quedan atrapadas */}
      {f > tGland && nubes.map((n) => {
        const t0 = tGland + n * 9;
        const sube = interpolate(f, [t0, t0 + 50], [1620, 1000 - (n % 2) * 70], { ...clamp, easing: Easing.out(Easing.cubic) });
        const xx = [150, 360, 560, 760, 300][n] + Math.sin((f + n * 30) / 14) * 18;
        const op = interpolate(f, [t0, t0 + 8], [0, 1], clamp);
        return <div key={n} style={{ position: 'absolute', left: xx, top: sube, opacity: op }}><NubeOlor tam={180} fase={n} /></div>;
      })}
      {/* firma: huella dactilar */}
      {f > tFirma && (
        <>
          <div style={{ position: 'absolute', left: 340, top: 520, transform: `scale(${firma}) rotate(${(1 - firma) * 30}deg)` }}>
            <svg width={400} height={400} viewBox="0 0 400 400">
              <circle cx={200} cy={200} r={190} fill={CREMA} stroke={TINTA} strokeWidth={10} />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <ellipse key={i} cx={200} cy={210} rx={30 + i * 20} ry={44 + i * 22} fill="none" stroke={LILA} strokeWidth={10}
                  strokeDasharray={`${180 + i * 50} 30`} strokeDashoffset={i * 40} />
              ))}
            </svg>
          </div>
          <Esquinas x={310} y={490} w={460} h={460} prog={firma} />
          <Pop desde={tFirma + 10} style={{ left: 330, top: 960 }}><Etiqueta texto="FIRMA PERSONAL" fondo={LILA} color={TINTA} tam={48} rot={3} /></Pop>
        </>
      )}
      {f < tFirma && <Pop desde={0} style={{ left: 0, right: 0, top: 560, textAlign: 'center' }}><Etiqueta texto="TRABAJO Nº 2" fondo={LILA} color={TINTA} tam={66} rot={-4} /></Pop>}
    </Fondo>
  );
};

const Cuchilla: React.FC<{ tam?: number }> = ({ tam = 360 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={tam} height={tam} viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
      <rect x={130} y={140} width={40} height={170} rx={18} fill="#4d5966" stroke={TINTA} strokeWidth={8} />
      <rect x={30} y={60} width={240} height={100} rx={22} fill="#c9d2dc" stroke={TINTA} strokeWidth={8} />
      <rect x={40} y={140} width={220} height={22} rx={6} fill="#eef3f7" stroke={TINTA} strokeWidth={6} />
      <Ojos x={150} y={98} r={17} enfado mira={Math.sin(f / 8)} />
      <path d="M100,132 L200,132" stroke={ROJO} strokeWidth={10} strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${54 + i * 38},162 l10,18 l10,-18`} fill={ROJO} stroke={TINTA} strokeWidth={4} />)}
    </svg>
  );
};

const EscenaRasurar: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tProb = s(3.5);
  const barrido = interpolate(f, [10, 70], [-400, 1300], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const enCementerio = f >= tProb;
  const xs = [140, 330, 520, 710, 900];
  if (!enCementerio) {
    return (
      <Fondo color="#3a0808" trama="#ff3b2e">
        <AbsoluteFill style={{ background: 'radial-gradient(70% 30% at 50% 62%, #ff7a55 0%, rgba(255,90,60,.55) 45%, transparent 100%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 520, background: PIEL, borderTop: `10px solid ${TINTA}` }} />
        {xs.map((px, i) => {
          const cortado = barrido > px - 40;
          const caida = cortado ? interpolate(barrido - px, [-40, 400], [0, 1], clamp) : 0;
          return (
            <div key={i} style={{ position: 'absolute', left: px - 60, top: 1040 + caida * 300, transform: `rotate(${caida * (i % 2 ? 80 : -80)}deg)`, opacity: 1 - caida * 0.6 }}>
              <Pelito alto={340} fase={i} casco={!cortado} triste={cortado} />
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: barrido - 180, top: 1080, transform: `rotate(${-10 + Math.sin(f / 3) * 4}deg)` }}><Cuchilla tam={380} /></div>
        <Pop desde={4} style={{ left: 0, right: 0, top: 620, textAlign: 'center' }}><Etiqueta texto="⚠ RASURADO" fondo={ROJO} tam={64} rot={-3} /></Pop>
      </Fondo>
    );
  }
  const g = f - tProb;
  return (
    <Fondo color={AMARILLO} trama="#d8860a">
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 560, background: '#7bbf3a', borderTop: `10px solid ${TINTA}` }} />
      <Trama color="#3c6a14" op={0.18} tam={20} />
      {xs.map((px, i) => (
        <Pop key={i} desde={i * 4} damping={8} style={{ left: px - 70, top: 1220 }}>
          <svg width={140} height={240} viewBox="0 0 140 240">
            <rect x={56} y={10} width={28} height={220} rx={6} fill="#fff" stroke={TINTA} strokeWidth={7} />
            <rect x={14} y={60} width={112} height={28} rx={6} fill="#fff" stroke={TINTA} strokeWidth={7} />
            <path d="M70,200 q-14,-18 0,-34" stroke={TINTA} strokeWidth={6} fill="none" strokeLinecap="round" />
          </svg>
        </Pop>
      ))}
      {/* fantasmas de pelitos */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: 250 + i * 240, top: 1000 - interpolate(g, [0, 100], [0, 260]) - i * 30, opacity: interpolate(g, [0, 15, 90, 105], [0, 0.65, 0.65, 0], clamp) }}>
          <Pelito alto={160} fase={i} casco={false} color="#ffffff" />
        </div>
      ))}
      {/* granitos rojos con etiquetas */}
      <Pop desde={6} style={{ left: 70, top: 560 }}><Etiqueta texto="PICOR" fondo={ROJO} tam={56} rot={-6} /></Pop>
      <Pop desde={22} style={{ left: 470, top: 680 }}><Etiqueta texto="IRRITACIÓN" fondo={ROJO} tam={56} rot={4} /></Pop>
      <Pop desde={40} style={{ left: 150, top: 820 }}><Etiqueta texto="PELOS ENCARNADOS" fondo={ROJO} tam={56} rot={-3} /></Pop>
    </Fondo>
  );
};

const Tijeras: React.FC<{ abre: number }> = ({ abre }) => (
  <svg width={300} height={300} viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
    <g transform={`rotate(${-abre * 14} 150 150)`}>
      <path d="M150,150 L290,110" stroke="#c9d2dc" strokeWidth={22} strokeLinecap="round" />
      <circle cx={70} cy={200} r={44} fill="none" stroke={LIMA} strokeWidth={20} />
      <path d="M150,150 L100,180" stroke={LIMA} strokeWidth={20} strokeLinecap="round" />
    </g>
    <g transform={`rotate(${abre * 14} 150 150)`}>
      <path d="M150,150 L290,190" stroke="#e3e9ef" strokeWidth={22} strokeLinecap="round" />
      <circle cx={70} cy={100} r={44} fill="none" stroke={LIMA} strokeWidth={20} />
      <path d="M150,150 L100,120" stroke={LIMA} strokeWidth={20} strokeLinecap="round" />
    </g>
    <circle cx={150} cy={150} r={12} fill={TINTA} />
  </svg>
);

const EscenaConsejo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abre = (Math.sin(f / 3) + 1) / 2;
  const tijX = interpolate(f, [0, 70], [-260, 820], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const ok = spring({ frame: f - 60, fps, config: { damping: 10 } });
  const xs = [180, 380, 580, 780];
  return (
    <Fondo color={CREMA} trama="#e08a3a">
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 520, background: PIEL, borderTop: `10px solid ${TINTA}` }} />
      {xs.map((px, i) => {
        const recortado = tijX > px;
        return (
          <div key={i} style={{ position: 'absolute', left: px - 60, top: recortado ? 1220 : 1040 }}>
            <Pelito alto={recortado ? 160 : 340} fase={i} saludo={recortado ? 1 : 0} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: tijX - 150, top: 1060 }}><Tijeras abre={abre} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', gap: 40 }}>
        <div style={{ position: 'relative' }}>
          <Etiqueta texto="RECORTAR" fondo={LIMA} color={TINTA} tam={56} rot={-3} />
          <svg width={330} height={180} style={{ position: 'absolute', left: -20, top: -30, overflow: 'visible', opacity: ok }}>
            <ellipse cx={165} cy={70} rx={180} ry={86} fill="none" stroke={LIMA} strokeWidth={12} strokeDasharray={900} strokeDashoffset={900 * (1 - ok)} />
          </svg>
        </div>
        <div style={{ position: 'relative', opacity: 0.85 }}>
          <Etiqueta texto="RASURAR" fondo="#cfc6b8" color={TINTA} tam={56} rot={3} />
          <svg width={300} height={120} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
            <path d="M10,10 L280,100 M280,10 L10,100" stroke={ROJO} strokeWidth={18} strokeLinecap="round" strokeDasharray={300} strokeDashoffset={300 * (1 - ok)} />
          </svg>
        </div>
      </div>
    </Fondo>
  );
};

const TarjetaFinal: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: f, fps, config: { damping: 12 } });
  return (
    <Fondo color={ROJO} trama="#000">
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 50 }}>
        <div style={{ transform: `scale(${k})` }}><Pelito alto={380} saludo={1} /></div>
        <div style={{ transform: `scale(${k}) rotate(-3deg)` }}>
          <div style={{ fontFamily: FUENTE, fontWeight: 900, fontSize: 92, color: '#fff', textAlign: 'center', lineHeight: 1.02, WebkitTextStroke: `12px ${TINTA}`, paintOrder: 'stroke fill', textShadow: `0 10px 0 ${TINTA}` }}>
            SÍGUEME<br />PARA MÁS<br /><span style={{ color: AMARILLO }}>CURIOSIDADES</span>
          </div>
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

// Transición tipo cómic: círculo que se cierra/abre
const Iris: React.FC<{ en: number[] }> = ({ en }) => {
  const f = useCurrentFrame();
  const d = 8;
  let r = 2400;
  for (const c of en) {
    if (f >= c - d && f < c + d) r = Math.abs(f - c) / d * 2400;
  }
  if (r >= 2400) return null;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs><mask id="iris"><rect width={1080} height={1920} fill="#fff" /><circle cx={540} cy={1000} r={r} fill="#000" /></mask></defs>
      <rect width={1080} height={1920} fill={TINTA} mask="url(#iris)" />
    </svg>
  );
};

const ESC = [
  { t0: 0, t1: 5.5, C: () => <EscenaGancho /> },
  { t0: 5.5, t1: 11.5, C: () => <EscenaPresentacion /> },
  { t0: 11.5, t1: 19, C: () => <EscenaRoce /> },
  { t0: 19, t1: 29.5, C: () => <EscenaOlor /> },
  { t0: 29.5, t1: 36.5, C: () => <EscenaRasurar /> },
  { t0: 36.5, t1: 40, C: () => <EscenaConsejo /> },
  { t0: 40, t1: 43, C: () => <EscenaGancho cierre /> },
  { t0: 43, t1: 46, C: () => <TarjetaFinal /> },
];

export const PelosAno: React.FC = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 15, DURACION - 45, DURACION], [0, 0.9, 0.9, 0], clamp);
  return (
    <AbsoluteFill style={{ background: TINTA }}>
      {ESC.map(({ t0, t1, C }, i) => (
        <Sequence key={i} from={s(t0)} durationInFrames={s(t1) - s(t0)}><C /></Sequence>
      ))}
      <Iris en={ESC.slice(1).map((e) => s(e.t0))} />
      <Subtitulos />
      <Audio src={staticFile('pelos/musica.wav')} volume={vol} />
    </AbsoluteFill>
  );
};
