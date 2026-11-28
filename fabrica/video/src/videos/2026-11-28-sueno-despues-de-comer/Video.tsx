/**
 * ¿Por qué te da sueño después de comer mucho? (2026-11-28)
 * 16 planos sincronizados con narracion.mp3 (46,2 s) + 1,8 s de remate.
 */
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Stage, Cam, ip, lin, pop, shake, INK, SW, Zzz, Gota, Video } from '../../lib/base';
import { Barbudo, Cabeza } from '../../lib/Barbudo';
import { Cerebro, Estomago, Corazon, Pulmones, Intestino, Mensajero, Rayo, Ojitos, Boquita } from '../../lib/Cuerpo';
import { Comedor, Plato, Reloj, SalaControl } from '../../lib/Escenarios';
import tiempos from './tiempos.json';

export const TOTAL = 1440;
const P = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const };

// ---------- personajes propios de este video ----------
/** Pavo asado con ojitos */
const Pavo: React.FC<{ ojos?: 'normal' | 'feliz' | 'susto' | 'sueño'; boca?: 'sonrisa' | 'o' | 'triste' | 'plana'; halo?: number; sudor?: number; s?: number }> = ({ ojos = 'normal', boca = 'sonrisa', halo = 0, sudor = 0, s = 1 }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`scale(${s})`}>
      {halo > 0 && <ellipse cx={0} cy={-150} rx={90} ry={22} fill="none" stroke="#ffd23f" strokeWidth={14} opacity={halo} transform={`translate(0,${Math.sin(f / 8) * 6})`} />}
      {[-1, 1].map((k) => (
        <g key={k} transform={`translate(${k * 120},-20) rotate(${k * -30})`}>
          <ellipse cx={0} cy={-40} rx={42} ry={70} fill="#b8642e" {...P} />
          <rect x={-12} y={-150} width={24} height={50} rx={10} fill="#f4f1ea" {...P} strokeWidth={4} />
          <path d="M-22,-150 l8,-16 l8,16 l8,-16 l8,16 l8,-16 l8,16" fill="#f4f1ea" {...P} strokeWidth={4} />
        </g>
      ))}
      <ellipse cx={0} cy={10} rx={170} ry={120} fill="#c8743a" {...P} />
      <ellipse cx={-50} cy={-40} rx={60} ry={30} fill="#e8a060" opacity={0.6} />
      <Ojitos y={10} sep={46} r={26} tipo={ojos} piel="#c8743a" />
      <Boquita y={70} tipo={boca} w={24} />
      {sudor > 0 && <Gota x={130} y={-40 + ((f * 1.5) % 40)} o={sudor} />}
    </g>
  );
};
/** Pierna de pollo con ojitos */
const Pollo: React.FC<{ ojos?: 'normal' | 'feliz' }> = ({ ojos = 'feliz' }) => (
  <g>
    <rect x={-16} y={60} width={32} height={90} rx={14} fill="#f4f1ea" {...P} />
    <ellipse cx={0} cy={0} rx={90} ry={100} fill="#d88a44" {...P} />
    <Ojitos y={-10} sep={30} r={20} tipo={ojos} piel="#d88a44" />
    <Boquita y={40} tipo="sonrisa" w={18} />
  </g>
);
/** Molécula de triptófano: esferitas amarillas (sin texto) */
const Molecula: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y + Math.sin(f / 7 + x) * 8}) rotate(${f * 2})`}>
      <line x1={-30} y1={0} x2={30} y2={0} stroke={INK} strokeWidth={6} /><line x1={0} y1={-30} x2={0} y2={20} stroke={INK} strokeWidth={6} />
      {[[-30, 0], [30, 0], [0, -30], [0, 20], [0, 0]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={i === 4 ? 18 : 12} fill={i === 4 ? '#ffd23f' : '#fff2a0'} {...P} strokeWidth={4} />)}
    </g>
  );
};
/** Pila de energía que se vacía */
const Pila: React.FC<{ nivel: number }> = ({ nivel }) => {
  const c = nivel > 0.5 ? '#7ed957' : nivel > 0.25 ? '#ffd23f' : '#ff6a5a';
  return (
    <g>
      <rect x={-70} y={-40} width={140} height={80} rx={14} fill="#2a2a3a" {...P} />
      <rect x={70} y={-16} width={16} height={32} rx={4} fill="#2a2a3a" {...P} strokeWidth={4} />
      <rect x={-58} y={-28} width={116 * nivel} height={56} rx={8} fill={c} />
    </g>
  );
};

// barbudo sentado a la mesa: hombros en (540,1080)
const sentadoMesa = { x: 540, y: 1080 };

// =============== planos ===============
const P1: React.FC = () => { // ¿Por qué después de una comida enorme te dan ganas de dormir?
  const f = useCurrentFrame();
  const ciclo = f % 50;
  const cabeceo = ciclo < 40 ? ip(ciclo, [0, 40], [0, 22]) : ip(ciclo, [40, 46], [22, -4]);
  return (
    <Stage fondo="grisMorado" bokeh={false}>
      <Cam cx={540} cy={ip(f, [0, 108], [1150, 1000])} s={ip(f, [0, 108], [0.92, 1.25])}>
        <Comedor hora={0.7}>
          <Barbudo {...sentadoMesa} panza={0.8} inclina={cabeceo} cabezaDy={cabeceo * 1.5}
            cabeza={{ boca: 'plana', cejas: 'cansado', parpado: ip(ciclo, [0, 40], [0.3, 0.85]), mira: [0, 0.5] }}
            brazoI={{ e: [-250, 180], m: [-160, 250] }} brazoD={{ e: [250, 180], m: [160, 250] }} />
        </Comedor>
        <Plato x={540} y={1300} s={1.1} vacio />
        <Plato x={540} y={1280} s={1.05} vacio />
        <Plato x={540} y={1262} s={1.0} vacio />
        <Zzz x={720} y={760} o={lin(f, [20, 40], [0, 1])} />
      </Cam>
    </Stage>
  );
};

const P2: React.FC = () => { // Seguro le echaste la culpa al pavo...
  const f = useCurrentFrame();
  const apunta = pop(f, 8);
  return (
    <Stage fondo="grisMorado" bokeh={false}>
      <Cam cx={ip(f, [0, 72], [560, 680])} cy={1050} s={1.05}>
        <Comedor hora={0.7}>
          <Barbudo {...sentadoMesa} panza={0.8} cabeza={{ boca: 'abierta', cejas: 'enojo', mira: [1, 0.3] }}
            brazoI={{ e: [-250, 180], m: [-160, 250] }}
            brazoD={{ e: [260 + apunta * 60, 120 - apunta * 60], m: [300 + apunta * 160, 60 + apunta * 40], mano: 'señala', rot: 70 + apunta * 20 }} />
        </Comedor>
        <g transform={`translate(${860 + shake(f, 4)[0]},1180)`}><Pavo ojos="susto" boca="o" sudor={lin(f, [10, 20], [0, 1])} s={0.9} /></g>
        <Plato x={420} y={1290} vacio />
      </Cam>
    </Stage>
  );
};

const P3: React.FC = () => { // pero el pavo es inocente:
  const f = useCurrentFrame();
  return (
    <Stage fondo="ambar">
      <g opacity={0.25}>
        {Array.from({ length: 12 }).map((_, i) => <path key={i} d="M540,1050 L500,-200 L580,-200 Z" fill="#ffe8a0" transform={`rotate(${i * 30 + f * 0.6},540,1050)`} />)}
      </g>
      <Cam cx={540} cy={1050} s={ip(f, [0, 48], [1.3, 1.6])}>
        <g transform="translate(540,1080)"><Pavo ojos="feliz" boca="sonrisa" halo={lin(f, [4, 14], [0, 1])} /></g>
      </Cam>
    </Stage>
  );
};

const P4: React.FC = () => { // tiene casi el mismo triptófano que el pollo.
  const f = useCurrentFrame();
  const ang = Math.sin(f / 5) * 14 * Math.exp(-f / 25);
  const rad = (ang * Math.PI) / 180;
  const ly = 1020 - Math.sin(rad) * 300, ry = 1020 + Math.sin(rad) * 300;
  return (
    <Stage fondo="ciruela">
      <Cam cx={540} cy={1080} s={ip(f, [0, 81], [0.95, 1.05])}>
        {/* balanza */}
        <rect x={500} y={1050} width={80} height={520} rx={20} fill="#c8a060" {...P} />
        <ellipse cx={540} cy={1590} rx={200} ry={44} fill="#a07840" {...P} />
        <line x1={240} y1={1020 - Math.sin(rad) * 300} x2={840} y2={1020 + Math.sin(rad) * 300} stroke={INK} strokeWidth={36} strokeLinecap="round" />
        <line x1={240} y1={1020 - Math.sin(rad) * 300} x2={840} y2={1020 + Math.sin(rad) * 300} stroke="#e0b860" strokeWidth={24} strokeLinecap="round" />
        <circle cx={540} cy={1020} r={30} fill="#ffd23f" {...P} />
        {[[240, ly], [840, ry]].map(([x, y], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={x - 110} y2={y + 260} stroke={INK} strokeWidth={5} />
            <line x1={x} y1={y} x2={x + 110} y2={y + 260} stroke={INK} strokeWidth={5} />
            <path d={`M${x - 150},${y + 260} Q${x},${y + 340} ${x + 150},${y + 260} Z`} fill="#c8c8d8" {...P} />
          </g>
        ))}
        <g transform={`translate(240,${ly + 180})`}><Pavo ojos="feliz" s={0.62} /></g>
        <g transform={`translate(840,${ry + 150})`}><Pollo /></g>
        {[0, 1, 2].map((k) => <Molecula key={k} x={150 + k * 90} y={ly - 120 - k * 40} />)}
        {[0, 1, 2].map((k) => <Molecula key={'b' + k} x={750 + k * 90} y={ry - 120 - k * 40} />)}
      </Cam>
    </Stage>
  );
};

const P5: React.FC = () => { // El verdadero culpable es el tamaño de la comida.
  const f = useCurrentFrame();
  const m = ip(f, [20, 80], [0.3, 1]);
  const s = ip(f, [20, 80], [1, 1.7]);
  return (
    <Stage fondo="noche">
      <path d="M440,300 L640,300 L1000,1700 L80,1700 Z" fill="#fff6c0" opacity={0.14} />
      <ellipse cx={540} cy={1560} rx={440} ry={70} fill="#fff6c0" opacity={0.15} />
      <Cam cx={540} cy={ip(f, [0, 111], [1250, 1100])} s={ip(f, [0, 111], [1.15, 0.92])}>
        <rect x={140} y={1450} width={800} height={60} rx={16} fill="#8a5a3a" {...P} />
        <Plato x={540} y={1440} s={s} montaña={m} />
        {[0, 1].map((k) => <g key={k} transform={`translate(${k ? 880 : 200},${1440 - pop(f, 60 + k * 12) * 0})`} opacity={pop(f, 60 + k * 12)}><Plato x={0} y={0} s={0.5} vacio /><Plato x={0} y={-14} s={0.5} vacio /></g>)}
        <g transform={`translate(${ip(f, [70, 100], [1300, 900])},1200) rotate(-15)`}>
          <Cabeza boca="o" cejas="arriba" mira={[-1, 0.2]} />
        </g>
      </Cam>
    </Stage>
  );
};

const P6: React.FC = () => { // Cuando llenas el estómago,
  const f = useCurrentFrame();
  const lleno = ip(f, [0, 45], [0, 1]);
  return (
    <Stage fondo="calor">
      <Cam cx={540} cy={1060} s={1}>
        {Array.from({ length: 10 }).map((_, i) => {
          const t0 = i * 4, p = lin(f, [t0, t0 + 14], [0, 1]);
          return p > 0 && p < 1 ? <circle key={i} cx={520 + (i % 3) * 20} cy={560 + p * 360} r={22} fill={['#e8c27a', '#8bc34a', '#c2703d', '#ffcf4a'][i % 4]} {...P} strokeWidth={4} /> : null;
        })}
        <path d="M520,560 L520,760" stroke={INK} strokeWidth={70 + SW * 2} strokeLinecap="round" />
        <path d="M520,560 L520,760" stroke="#f48aa0" strokeWidth={70} strokeLinecap="round" />
        <g transform="translate(560,1060)"><Estomago lleno={lleno} ojos={lleno > 0.7 ? 'susto' : 'normal'} boca={lleno > 0.7 ? 'o' : 'sonrisa'} /></g>
      </Cam>
    </Stage>
  );
};

const P7: React.FC = () => { // tu cuerpo activa el modo "descansar y digerir":
  const f = useCurrentFrame();
  // "descansar" ≈ fotograma 36 del plano
  const camina = ip(f, [0, 28], [0, 1]);
  const palanca = ip(f, [30, 40], [0, 1]);
  const modo = ip(f, [36, 80], [0, 1]);
  return (
    <Stage fondo="ciruela" bokeh={false}>
      <Cam cx={ip(f, [0, 40, 99], [600, 760, 600])} cy={1200} s={ip(f, [0, 99], [1.1, 0.95])}>
        <SalaControl modo={modo} palanca={palanca}>
          <g transform={`translate(${420 + camina * 300},${1170 - (palanca > 0 && palanca < 1 ? 30 : 0)}) scale(1)`}>
            <Cerebro audifonos ojos={modo > 0.6 ? 'feliz' : 'normal'} boca={modo > 0.6 ? 'sonrisa' : 'plana'} patas={camina < 1 ? 1 : 0} mira={[1, 0.4]} />
          </g>
        </SalaControl>
      </Cam>
    </Stage>
  );
};

const P8: React.FC = () => { // el corazón se calma,
  const f = useCurrentFrame();
  return (
    <Stage fondo="ciruela">
      <Cam cx={540} cy={1080} s={ip(f, [0, 43], [1.0, 1.15])}>
        <g transform="translate(540,1080)"><Corazon bpm={ip(f, [0, 40], [130, 50])} ojos={f > 22 ? 'sueño' : 'normal'} boca="sonrisa" /></g>
      </Cam>
    </Stage>
  );
};

const P9: React.FC = () => { // la respiración baja el ritmo y
  const f = useCurrentFrame();
  return (
    <Stage fondo="noche">
      <Cam cx={540} cy={1080} s={ip(f, [0, 56], [1.15, 1.0])}>
        <g transform="translate(540,1120)"><Pulmones periodo={ip(f, [0, 50], [0.8, 3])} ojos="sueño" boca={f > 30 ? 'o' : 'sonrisa'} /></g>
        {f > 30 && <path d={`M${540 + (f - 30) * 6},${930} q30,-20 60,0 t60,0`} stroke="#fff" strokeWidth={6} fill="none" opacity={lin(f, [30, 56], [1, 0])} strokeLinecap="round" />}
      </Cam>
    </Stage>
  );
};

const P10: React.FC = () => { // gran parte de tu energía se va a procesar ese banquete.
  const f = useCurrentFrame();
  return (
    <Stage fondo="ciruela">
      <Cam cx={540} cy={ip(f, [0, 60], [800, 1250])} s={ip(f, [0, 105], [0.85, 0.95])}>
        <path d="M540,820 C540,1000 620,1100 560,1300" stroke={INK} strokeWidth={90 + SW * 2} fill="none" strokeLinecap="round" />
        <path d="M540,820 C540,1000 620,1100 560,1300" stroke="#3a2a4a" strokeWidth={90} fill="none" strokeLinecap="round" />
        <g transform="translate(540,660) scale(0.75)"><Cerebro ojos="sueño" boca="plana" color="#d88aa8" /></g>
        {Array.from({ length: 7 }).map((_, i) => {
          const p = ((f * 1.6 + i * 22) % 120) / 120;
          const y = 780 + p * 620;
          return <g key={i} transform={`translate(${545 + Math.sin(p * 4) * 30},${y})`} opacity={p < 0.95 ? 1 : 0}><Rayo s={0.55} /></g>;
        })}
        <g transform="translate(560,1560)"><Estomago lleno={1} amasa={1} ojos="enojo" boca="grande" /></g>
        {[[380, 1450], [760, 1480]].map(([x, y], i) => <Gota key={i} x={x} y={y + ((f * 2 + i * 20) % 40)} s={1.2} />)}
      </Cam>
    </Stage>
  );
};

const P11: React.FC = () => { // Además, tu intestino libera hormonas que le avisan al cerebro que ya estás satisfecho,
  const f = useCurrentFrame();
  return (
    <Stage fondo="verdoso">
      <Cam cx={540} cy={ip(f, [10, 130], [1450, 700])} s={0.9}>
        <g transform="translate(540,1520) scale(0.85)"><Intestino ojos="feliz" /></g>
        {/* camino hacia arriba */}
        <path d="M540,1380 C760,1200 320,1000 540,800" stroke="#fff" strokeOpacity={0.15} strokeWidth={60} fill="none" strokeLinecap="round" strokeDasharray="10 30" />
        {[0, 1, 2].map((k) => {
          const p = lin(f, [10 + k * 18, 110 + k * 18], [0, 1]);
          const t = p;
          const x = (1 - t) ** 3 * 540 + 3 * (1 - t) ** 2 * t * 760 + 3 * (1 - t) * t * t * 320 + t ** 3 * 540;
          const y = (1 - t) ** 3 * 1380 + 3 * (1 - t) ** 2 * t * 1200 + 3 * (1 - t) * t * t * 1000 + t ** 3 * 800;
          return p > 0 && p < 1 ? <g key={k} transform={`translate(${x},${y}) scale(0.9)`}><Mensajero color={['#7ed957', '#6ec8ff', '#ffd23f'][k]} /></g> : null;
        })}
        <g transform="translate(540,600) scale(0.8)"><Cerebro ojos={f > 110 ? 'feliz' : 'normal'} boca="sonrisa" mira={[0, 1]} /></g>
      </Cam>
    </Stage>
  );
};

const P12: React.FC = () => { // y algunas de esas señales también podrían darte sueño.
  const f = useCurrentFrame();
  const bost = f > 45;
  return (
    <Stage fondo="noche">
      <Cam cx={540} cy={1050} s={ip(f, [0, 102], [1.1, 1.4])}>
        <g transform={`translate(540,1080) rotate(${bost ? Math.sin(f / 10) * 4 : 0})`}><Cerebro ojos={bost ? 'cerrados' : 'normal'} boca={bost ? 'bostezo' : 'sonrisa'} mira={[0.3, 1]} /></g>
        <g transform={`translate(${ip(f, [0, 20], [800, 660])},${ip(f, [0, 20], [1500, 1250])}) rotate(-10)`} opacity={lin(f, [40, 50], [1, 0])}>
          <Mensajero color="#6ec8ff" paso={0} />
        </g>
        <Zzz x={720} y={880} o={lin(f, [55, 70], [0, 1])} s={1.2} />
      </Cam>
    </Stage>
  );
};

const P13: React.FC = () => { // Y si comes a media tarde, se suma tu reloj biológico,
  const f = useCurrentFrame();
  const hora = ip(f, [0, 70], [12, 15.5]);
  return (
    <Stage fondo="grisMorado" bokeh={false}>
      <Cam cx={ip(f, [0, 96], [420, 640])} cy={ip(f, [0, 96], [760, 900])} s={ip(f, [0, 96], [1.25, 1.45])}>
        <Comedor hora={ip(f, [0, 70], [0, 1])} reloj={hora} mesaY={1400} />
      </Cam>
    </Stage>
  );
};

const P14: React.FC = () => { // que de por sí baja tu energía a esa hora.
  const f = useCurrentFrame();
  const nivel = ip(f, [5, 70], [0.9, 0.15]);
  const caida = ip(f, [10, 80], [0, 1]);
  return (
    <Stage fondo="grisMorado" bokeh={false}>
      <Cam cx={540} cy={ip(f, [0, 81], [1000, 950])} s={1.2}>
        <Comedor hora={1}>
          <Barbudo {...sentadoMesa} panza={0.8} cabezaDy={caida * 40} inclina={caida * 8} cabeza={{ boca: 'ondulada', cejas: 'cansado', parpado: 0.3 + caida * 0.5, mira: [0, -0.8 + caida] }}
            brazoI={{ e: [-260, 200], m: [-200, 260] }} brazoD={{ e: [260, 200], m: [200, 260] }} />
        </Comedor>
        <g transform={`translate(540,${520 + Math.sin(f / 8) * 8})`}><Pila nivel={nivel} /></g>
      </Cam>
    </Stage>
  );
};

const P15: React.FC = () => { // Así que la próxima vez que te duermas en la sobremesa, no culpes al pavo:
  const f = useCurrentFrame();
  const alivio = f > 80;
  return (
    <Stage fondo="grisMorado" bokeh={false}>
      <Cam cx={ip(f, [0, 130], [560, 640])} cy={1080} s={ip(f, [0, 130], [1.0, 1.12])}>
        <Comedor hora={1.1}>
          <Barbudo {...sentadoMesa} panza={0.8} cabezaDy={170} cabezaDx={-30} inclina={-18} cabeza={{ boca: 'abierta', dormido: true, cejas: 'cansado' }}
            brazoI={{ e: [-240, 200], m: [-100, 240] }} brazoD={{ e: [240, 200], m: [100, 240] }} />
        </Comedor>
        <Zzz x={420} y={820} />
        <g transform={`translate(860,1180) rotate(${alivio ? Math.sin(f / 3) * 6 : 0})`}><Pavo ojos={alivio ? 'feliz' : 'normal'} boca={alivio ? 'sonrisa' : 'plana'} sudor={alivio ? 0 : 1} s={0.85} /></g>
      </Cam>
    </Stage>
  );
};

const P16: React.FC = () => { // culpa al tercer plato.
  const f = useCurrentFrame();
  const llega = ip(f, [0, 16], [0, 1]);
  const mira = f > 22 && f < 70;
  const cae = ip(f, [72, 82], [0, 1], (x) => x * x);
  return (
    <Stage fondo="grisMorado" bokeh={false}>
      <Cam cx={540} cy={ip(f, [0, 60], [1080, 1000])} s={ip(f, [0, 70], [1.1, 1.35])}>
        <Comedor hora={1.1}>
          <Barbudo {...sentadoMesa} panza={0.9} cabezaDy={mira ? 40 : 40 + cae * 150} inclina={mira ? 6 : cae * -10}
            cabeza={{ boca: mira ? 'culpable' : 'abierta', cejas: mira ? 'picaro' : 'cansado', ojoGuino: mira, dormido: !mira, mira: [0, 0] }}
            brazoI={{ e: [-240, 200], m: [-130, 250] }} brazoD={{ e: [240, 200], m: [130, 250] }} />
        </Comedor>
        <g transform={`translate(${1500 - llega * 680},0)`}><Plato x={0} y={1300} s={0.95} montaña={0.9} /></g>
        {f > 84 && <Zzz x={720} y={860} />}
      </Cam>
    </Stage>
  );
};

const PLANOS: [number, React.FC][] = [
  [0, P1], [108, P2], [180, P3], [228, P4], [309, P5], [420, P6], [465, P7], [564, P8],
  [607, P9], [663, P10], [768, P11], [921, P12], [1023, P13], [1119, P14], [1200, P15], [1330, P16],
];
const CLAVES = ['dormir', 'pavo', 'inocente', 'triptófano', 'pollo', 'culpable', 'tamaño', 'estómago', 'descansar', 'digerir', 'corazón', 'respiración',
  'energía', 'hormonas', 'cerebro', 'satisfecho', 'sueño', 'tarde', 'reloj', 'biológico', 'sobremesa', 'tercer', 'plato'];

export const Componente: React.FC = () => <Video planos={PLANOS} total={TOTAL} palabras={tiempos.palabras} claves={CLAVES} />;
