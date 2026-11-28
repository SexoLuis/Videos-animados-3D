import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Stage, Cam, ip, lin, pop, shake, Halo, rnd, Sparkle } from './common';
import { Head, Hand, Arm, Torso, Foot, HeadProps } from './Personaje';
import { Cuarto, Cama, Cobijas, Cobija, Almohada } from './Cuarto';
import { SalaControl, Operador, Tunel } from './Cerebro';
import { Musculos, Vasos } from './Medico';

const HEAD_Y = 1080; // cabeza acostada sobre la almohada

/** Personaje acostado: cabeza + manos agarrando la cobija */
const Acostado: React.FC<{ amp: number; head: HeadProps; heat?: number; hands?: boolean; handsY?: number }> = ({ amp, head, heat = 0, hands = true, handsY = 1215 }) => {
  const f = useCurrentFrame();
  const [hx, hy] = shake(f, amp, 1);
  const [ax, ay] = shake(f, amp * 0.8, 4);
  return (
    <>
      <g transform={`translate(${540 + hx},${HEAD_Y + hy}) rotate(${hx * 0.3})`}><Head heat={heat} {...head} /></g>
      {hands && (
        <>
          <Hand uid="hl" x={420 + ax} y={handsY + ay} r={8} s={0.8} heat={heat} />
          <Hand uid="hr" x={660 - ax} y={handsY + ay * 0.7} r={-8} s={0.8} heat={heat} flip />
        </>
      )}
    </>
  );
};

/** Aliento helado */
const Aliento: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => {
  const f = useCurrentFrame();
  return (
    <g opacity={o}>
      {[0, 1, 2].map((k) => {
        const p = ((f + k * 14) % 42) / 42;
        return <circle key={k} cx={x + p * 60 + k * 10} cy={y - p * 90} r={14 + p * 30} fill="#dff4ff" opacity={(1 - p) * 0.35} />;
      })}
    </g>
  );
};

/** Ondas de calor que salen del cuerpo */
const OndasCalor: React.FC<{ x: number; y: number; o: number; color?: string }> = ({ x, y, o, color = '#ff5a2a' }) => {
  const f = useCurrentFrame();
  return (
    <g opacity={o} fill="none">
      {[0, 1, 2].map((k) => {
        const p = ((f * 1.2 + k * 20) % 60) / 60;
        return <ellipse key={k} cx={x} cy={y} rx={200 + p * 360} ry={140 + p * 260} stroke={color} strokeWidth={10 * (1 - p)} opacity={1 - p} />;
      })}
    </g>
  );
};

// =============== ESCENA 1 ===============
export const S1A: React.FC = () => {
  const f = useCurrentFrame();
  const s = ip(f, [0, 70], [0.9, 1.55]);
  const cy = ip(f, [0, 70], [1180, 1020]);
  const [cxs, cys] = shake(f, lin(f, [40, 80], [0, 6]), 9);
  return (
    <Stage>
      <Cam cx={540 + cxs} cy={cy + cys} s={s}>
        <Cuarto t={0} />
        <Cama t={0} />
        <Acostado amp={9} head={{ mouth: 'chatter', brow: 'worried', frost: 0.8, look: [Math.sin(f / 9) * 0.6, -0.2], uid: '1a' }} />
        <Cobijas t={0} n={3} jig={5} />
        <Hand uid="g1" x={420} y={1215} r={8} s={0.8} />
        <Aliento x={580} y={1170} />
      </Cam>
    </Stage>
  );
};

export const S1B: React.FC = () => {
  const f = useCurrentFrame();
  const s = ip(f, [0, 64], [1.75, 2.05]);
  const core = ip(f, [4, 30], [0, 0.95]);
  const extra = ip(f, [22, 56], [0, 1]);
  return (
    <Stage>
      <Cam cx={540} cy={HEAD_Y - 60 + extra * 40} s={s}>
        <Cuarto t={0} />
        <Cama t={0} />
        <Halo x={540} y={1420} r={520} color="#ff3a1a" o={core * (0.7 + 0.2 * Math.sin(f / 4))} />
        <Acostado amp={7} head={{ mouth: 'chatter', brow: 'panic', core, frost: 0.6, look: [0, 0.3], uid: '1b' }} />
        <Cobijas t={0} n={3} jig={4} extra={extra} />
        {/* manos tirando de la cuarta cobija */}
        <Hand uid="p1" x={430} y={1760 - extra * 600} r={170} s={0.85} />
        <Hand uid="p2" x={650} y={1760 - extra * 600} r={190} s={0.85} flip />
        <OndasCalor x={540} y={1450} o={core * 0.6} />
      </Cam>
    </Stage>
  );
};

// =============== ESCENA 2 ===============
export const S2A: React.FC = () => {
  const f = useCurrentFrame();
  const dive = ip(f, [0, 22], [2.05, 9], (x) => x * x);
  const flash = lin(f, [14, 22, 30], [0, 1, 0]);
  return (
    <Stage>
      {f < 22 ? (
        <Cam cx={540} cy={HEAD_Y - 40} s={dive}>
          <Cuarto t={0} />
          <Cama t={0} />
          <Acostado amp={5} head={{ mouth: 'chatter', brow: 'worried', core: 0.9, uid: '2a' }} />
          <Cobijas t={0} n={3} extra={1} />
        </Cam>
      ) : (
        <Tunel p={lin(f, [22, 72], [0, 1])} />
      )}
      <rect x={0} y={0} width={1080} height={1920} fill="#dff4ff" opacity={flash} />
    </Stage>
  );
};

/** Monitor de la sala que muestra al personaje */
const Monitor: React.FC<{ heat: number; amp: number }> = ({ heat, amp }) => {
  const f = useCurrentFrame();
  const [x, y] = shake(f, amp, 3);
  return (
    <g transform="translate(60,470)">
      <rect x={0} y={0} width={330} height={250} rx={24} fill="#05060f" stroke="#7fdcff" strokeWidth={5} />
      <clipPath id="monclip"><rect x={10} y={10} width={310} height={230} rx={18} /></clipPath>
      <g clipPath="url(#monclip)">
        <rect x={10} y={10} width={310} height={230} fill={heat > 0.5 ? '#2a0a10' : '#06152e'} />
        <Halo x={165} y={230} r={220} color="#ff3a1a" o={heat} />
        <g transform={`translate(${165 + x},${150 + y}) scale(0.5)`}><Head heat={heat} mouth="chatter" brow="worried" core={heat} uid="mon" /></g>
        {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={10} y={10 + ((i * 22 + f * 2) % 240)} width={310} height={3} fill="#fff" opacity={0.07} />)}
      </g>
    </g>
  );
};

export const S2B: React.FC = () => {
  const f = useCurrentFrame();
  const alarm = lin(f, [18, 24], [0, 1]);
  const jump = f < 20 ? 0 : Math.max(0, Math.sin(((f - 20) / 16) * Math.PI)) * (f < 36 ? 1 : 0);
  const target = ip(f, [24, 100], [0.42, 0.5]);
  const cy = ip(f, [0, 60], [900, 1150]);
  const s = ip(f, [0, 108], [0.95, 1.12]);
  return (
    <Stage>
      <Cam cx={540} cy={cy} s={s} r={lin(f, [0, 108], [-2, 1])}>
        <SalaControl t={lin(f, [20, 108], [0, 0.35])} target={target} level={0.42} alarm={alarm} />
        <Monitor heat={0.1} amp={4} />
        <Operador x={300} y={1470} armL={f < 20 ? 30 : -150} armR={f < 20 ? -20 : 150} mug={f < 20} jump={jump}
          eyes={f < 20 ? 'normal' : 'wide'} look={f < 20 ? [0.6, 0.3] : [0.8, -0.6]} />
        {f >= 20 && f < 50 && (
          <g transform={`translate(${200 - (f - 20) * 6},${1200 - (f - 20) * 14 + Math.pow(f - 20, 2) * 0.9}) rotate(${(f - 20) * 25})`}>
            <rect x={-26} y={-30} width={52} height={60} rx={10} fill="#5ff0ff" />
          </g>
        )}
      </Cam>
    </Stage>
  );
};

export const S2C: React.FC = () => {
  const f = useCurrentFrame();
  // "37" en el fotograma ~68, "39" en el ~92
  const lever = ip(f, [72, 88], [0, 1]);
  const target = f < 74 ? 0.5 + Math.sin(f / 4) * 0.004 : ip(f, [74, 98], [0.5, 0.74]);
  const t = ip(f, [76, 110], [0.35, 1]);
  const s = ip(f, [0, 60], [1.0, 1.32]);
  const cy = ip(f, [0, 60, 100], [1150, 1050, 900]);
  const [sx, sy] = shake(f, lin(f, [80, 90, 120], [0, 10, 3]), 2);
  return (
    <Stage>
      <Cam cx={600 + sx} cy={cy + sy} s={s}>
        <SalaControl t={t} target={target} level={0.42} alarm={1} heaters={lin(f, [92, 120], [0, 1])} lever={lever} buttons={lin(f, [90, 110], [0, 1])} />
        <Monitor heat={lin(f, [90, 138], [0.1, 0.4])} amp={5} />
        <Operador x={760} y={1470} armR={lin(f, [40, 72], [-20, -170]) + lever * 90} armL={-40 - lever * 60} lean={lever * -8} eyes="wide" look={[0.6, -0.8]} sweat={lever} />
      </Cam>
      <rect x={0} y={0} width={1080} height={1920} fill="#ff2a2a" opacity={lin(f, [88, 92, 104], [0, 0.35, 0])} />
    </Stage>
  );
};

export const S2D: React.FC = () => {
  const f = useCurrentFrame();
  const level = ip(f, [0, 161], [0.42, 0.6]);
  const s = ip(f, [0, 161], [0.95, 1.25]);
  const cy = ip(f, [0, 80, 161], [1100, 1000, 820]);
  const press = Math.abs(Math.sin(f / 3.2));
  return (
    <Stage>
      <Cam cx={ip(f, [0, 80, 161], [400, 480, 540])} cy={cy} s={s}>
        <SalaControl t={1} target={0.74} level={level} alarm={1} heaters={1} lever={1} buttons={1} />
        <Monitor heat={ip(f, [0, 60], [0.4, 0.85])} amp={6} />
        <Operador x={270} y={1470} armL={-60 - press * 50} armR={60 + press * 50} eyes="wide" look={[0.9, -0.9]} sweat={1} jump={Math.abs(Math.sin(f / 6)) * 0.15} />
      </Cam>
    </Stage>
  );
};

// =============== ESCENA 3 ===============
export const S3A: React.FC = () => {
  const f = useCurrentFrame();
  const amp = ip(f, [0, 30], [1, 14]);
  // la cuarta cobija llega volando con "cobijas" (fotograma ~55)
  const fly = ip(f, [40, 62], [0, 1], (x) => x);
  const land = pop(f, 62, 9, 180);
  return (
    <Stage>
      <Cam cx={540} cy={ip(f, [0, 91], [1150, 1110])} s={ip(f, [0, 91], [1.05, 1.25])}>
        <Cuarto t={0.2} />
        <Cama t={0.2} />
        <Halo x={540} y={1450} r={480} color="#ff3a1a" o={0.45} />
        <Acostado amp={amp} heat={0.15} head={{ mouth: 'chatter', brow: 'worried', core: 0.5, frost: 0.4, uid: '3a', look: [0.7 * fly, -0.3] }} />
        <Cobijas t={0.2} n={3} jig={amp * 0.6} />
        {f >= 40 && f < 62 && (
          <g transform={`translate(${1300 - fly * 760},${700 + fly * 700 - Math.sin(fly * Math.PI) * 300}) rotate(${(1 - fly) * 90})`}>
            <Cobija kind={3} t={0.2} w={760} h={420} />
          </g>
        )}
        {f >= 62 && (
          <g transform={`translate(540,${1500 + (1 - land) * 30}) scale(${1 + (1 - land) * 0.1},${land})`}>
            <Cobija kind={3} t={0.2} w={900} h={520} />
          </g>
        )}
      </Cam>
    </Stage>
  );
};

export const S4: React.FC = () => {
  const f = useCurrentFrame();
  if (f < 52) {
    const k = ip(f, [4, 46], [0, 1]);
    return (
      <Stage>
        <Cam cx={ip(f, [0, 52], [540, 560])} cy={ip(f, [0, 52], [1150, 900])} s={ip(f, [0, 52], [0.95, 1.25])}>
          <Vasos k={k} />
        </Cam>
      </Stage>
    );
  }
  const g = f - 52;
  const fade = lin(g, [0, 8], [0, 1]);
  const [x, y] = shake(f, 8, 2);
  const surprise = pop(g, 6, 10, 200);
  return (
    <Stage>
      <g opacity={fade}>
        <Cam cx={540} cy={ip(g, [0, 46], [1180, 1120])} s={ip(g, [0, 46], [1.0, 1.1])}>
          <Sentado t={0.15} heat={0.1} core={0.85} amp={8}
            head={{ mouth: 'o', brow: 'surprised', frost: 0.6, look: [-0.4, 0.6], uid: '4b' }}
            handL={[380 + x, 1080 + y - surprise * 40, -20]} handR={[700 - x, 1080 + y - surprise * 40, 20]} icy={0.9} feetIcy={0.9} blanketY={1420} feet />
        </Cam>
      </g>
    </Stage>
  );
};

/** Personaje sentado en la cama */
const Sentado: React.FC<{
  t: number; heat: number; core?: number; amp?: number; head: HeadProps; handL: [number, number, number]; handR: [number, number, number];
  icy?: number; feetIcy?: number; blanketY?: number; feet?: boolean; floor?: boolean; win?: number; children?: React.ReactNode; rightItem?: React.ReactNode; headDy?: number;
}> = ({ t, heat, core = 0, amp = 0, head, handL, handR, icy = 0, feetIcy = 0, blanketY = 1400, feet = false, floor = false, win = 0, children, rightItem, headDy = 0 }) => {
  const f = useCurrentFrame();
  const [hx, hy] = shake(f, amp, 1);
  const [bx, by] = shake(f, amp * 0.6, 5);
  const shL = [400 + bx, 960 + by], shR = [680 + bx, 960 + by];
  return (
    <>
      <Cuarto t={t} win={win} />
      <Cama t={t} />
      <g transform={`translate(${540 + bx},${950 + by})`}><Torso heat={heat} core={core} uid="t" /></g>
      <g transform={`translate(${540 + hx},${790 + hy + headDy})`}><Head heat={heat} {...head} /></g>
      <Cobijas t={t} n={1} dy={blanketY - 1185} />
      {children}
      <Arm heat={heat} d={`M${shL[0]},${shL[1]} Q${shL[0] - 80},${(shL[1] + handL[1]) / 2 + 80} ${handL[0]},${handL[1] + 30}`} />
      <Arm heat={heat} d={`M${shR[0]},${shR[1]} Q${shR[0] + 80},${(shR[1] + handR[1]) / 2 + 80} ${handR[0]},${handR[1] + 30}`} />
      <Hand uid="sl" x={handL[0]} y={handL[1]} r={handL[2]} heat={heat} icy={icy} />
      {rightItem ?? <Hand uid="sr" x={handR[0]} y={handR[1]} r={handR[2]} heat={heat} icy={icy} flip />}
      {feet && (
        <>
          <Foot uid="fl" x={420 + bx} y={1620} r={-8} heat={heat} icy={feetIcy} />
          <Foot uid="fr" x={660 - bx} y={1620} r={8} heat={heat} icy={feetIcy} />
          {feetIcy > 0 && [420, 660].map((x) => <Halo key={x} x={x} y={1620} r={140} color="#7fdcff" o={feetIcy * 0.6} />)}
        </>
      )}
      {floor && (
        <>
          <g transform="translate(220,1830) rotate(-12)"><Cobija kind={0} t={t} w={520} h={180} /></g>
          <g transform="translate(860,1800) rotate(14)"><Cobija kind={1} t={t} w={480} h={170} /></g>
          <g transform="translate(560,1900) rotate(4)"><Cobija kind={3} t={t} w={600} h={160} /></g>
        </>
      )}
      <rect x={-300} y={blanketY + 900} width={0} height={0} />
    </>
  );
};

export const S3B: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Stage>
      <Cam cx={540} cy={1080} s={ip(f, [0, 100], [1.0, 1.18])} r={lin(f, [0, 100], [-5, 4])}>
        <Musculos heat={ip(f, [0, 100], [0.3, 1])} />
      </Cam>
    </Stage>
  );
};

export const S3C: React.FC = () => {
  const f = useCurrentFrame();
  const amp = 18;
  const [bx, by] = shake(f, 12, 7);
  const pil = Math.abs(Math.sin(f / 5)) * 90;
  const [cx, cy] = shake(f, 7, 3);
  return (
    <Stage>
      <Cam cx={540 + cx} cy={1130 + cy} s={ip(f, [0, 87], [0.92, 1.02])}>
        <Cuarto t={0.45} wobble={6} thermo={0.75} />
        <g transform={`translate(${bx},${by})`}>
          <Cama t={0.45} pillow={`translate(0,${-pil}) rotate(${Math.sin(f / 4) * 10},540,1120)`} />
          <Acostado amp={amp} heat={0.45} head={{ mouth: 'grimace', brow: 'panic', core: 0.6, uid: '3c', look: [Math.sin(f / 3) * 0.5, -0.5] }} />
          <Cobijas t={0.45} n={3} jig={10} />
          <g transform="translate(540,1500)"><Cobija kind={3} t={0.45} w={900} h={520} /></g>
        </g>
        <OndasCalor x={540} y={1380} o={0.7} />
        {/* líneas de vibración */}
        {[[120, 1350], [960, 1350], [140, 1650], [950, 1650]].map(([x, y], i) => (
          <path key={i} d={`M${x},${y - 60} q${i % 2 ? 20 : -20},30 0,60 q${i % 2 ? -20 : 20},30 0,60`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.5 + 0.5 * Math.sin(f + i)} strokeLinecap="round" />
        ))}
      </Cam>
    </Stage>
  );
};

// =============== ESCENA 5 ===============
export const S5A: React.FC = () => {
  const f = useCurrentFrame();
  // "bajar" ~47, "ajustar" ~93
  const target = ip(f, [88, 112], [0.74, 0.44]);
  const lever = ip(f, [50, 64], [1, 0]);
  const heaters = ip(f, [56, 80], [1, 0]);
  const fans = ip(f, [112, 130], [0, 1]);
  const t = f < 112 ? ip(f, [40, 100], [1, 0.75]) : ip(f, [112, 140], [0.75, 2]);
  const slam = f >= 108 && f < 120;
  return (
    <Stage>
      <Cam cx={ip(f, [0, 70, 144], [760, 620, 540])} cy={ip(f, [0, 70, 144], [1150, 1000, 1000])} s={ip(f, [0, 144], [1.25, 1.0])}>
        <SalaControl t={t} target={target} level={0.74} alarm={lin(f, [40, 50], [1, 0])} heaters={heaters} lever={lever} fans={fans} buttons={fans} />
        <Monitor heat={ip(f, [0, 144], [0.85, 0.6])} amp={2} />
        <Operador x={760} y={1470} armR={f < 50 ? -20 : f < 70 ? -150 + lever * 0 : 20} armL={slam ? -120 : 30}
          eyes={f < 40 ? 'wide' : f < 108 ? 'relief' : 'wide'} look={[0, -0.6]} jump={slam ? 0.25 : 0} lean={slam ? -10 : 0} sweat={1 - fans} />
      </Cam>
      <rect x={0} y={0} width={1080} height={1920} fill="#bff8ff" opacity={lin(f, [112, 116, 130], [0, 0.35, 0])} />
    </Stage>
  );
};

export const S5B: React.FC = () => {
  const f = useCurrentFrame();
  const sweat = ip(f, [0, 30], [0.3, 1]);
  const l2 = ip(f, [62, 84], [0, 1]);
  return (
    <Stage>
      <Cam cx={540} cy={ip(f, [0, 90], [1100, 1060])} s={ip(f, [0, 30], [1.6, 1.3])}>
        <Cuarto t={1} rain={0.4} thermo={0.9} flash={false} />
        <Cama t={1} />
        <Acostado amp={3} heat={1} head={{ mouth: 'pant', brow: 'panic', sweat, uid: '5b', look: [0, -0.4], gorroTilt: 12 }} />
        <Cobijas t={1} n={3} lift={[0, 0, l2]} jig={3} />
        {/* vapor */}
        {Array.from({ length: 8 }).map((_, i) => {
          const p = ((f * 1.4 + i * 22) % 90) / 90;
          return <circle key={i} cx={540 + (rnd(i) - 0.5) * 300 + Math.sin(f / 8 + i) * 20} cy={850 - p * 300} r={30 + p * 50} fill="#ffd0b0" opacity={(1 - p) * 0.25 * sweat} />;
        })}
        {/* gotas que salen disparadas */}
        {Array.from({ length: 16 }).map((_, i) => {
          const p = ((f * 2 + i * 13) % 50) / 50;
          const a = -Math.PI / 2 + (rnd(i) - 0.5) * 2.6;
          return <circle key={'d' + i} cx={540 + Math.cos(a) * (140 + p * 300)} cy={1080 + Math.sin(a) * (140 + p * 300) + p * p * 200} r={9} fill="#9fe8ff" opacity={(1 - p) * sweat} />;
        })}
        <OndasCalor x={540} y={1300} o={0.6} color="#ff8a3a" />
      </Cam>
    </Stage>
  );
};

export const S5C: React.FC = () => {
  const f = useCurrentFrame();
  if (f < 40) {
    const l1 = ip(f, [2, 18], [0, 1]);
    const l0 = ip(f, [16, 34], [0, 1]);
    return (
      <Stage>
        <Cam cx={540} cy={1150} s={1.1}>
          <Cuarto t={1} rain={0.4} thermo={0.9} flash={false} />
          <Cama t={1} />
          <Acostado amp={4} heat={1} head={{ mouth: 'pant', brow: 'panic', sweat: 1, uid: '5c', gorroTilt: 14 }} />
          <Cobijas t={1} n={2} lift={[l0, l1]} />
        </Cam>
      </Stage>
    );
  }
  const g = f - 40;
  const fade = lin(g, [0, 6], [0, 1]);
  const win = ip(g, [22, 40], [0, 1]);
  const t = ip(g, [24, 59], [1, 1.55]);
  const fan = Math.sin(g * 0.9) * 35;
  const lean = ip(g, [14, 30], [0, 1]) * (1 - ip(g, [40, 55], [0, 1]));
  return (
    <Stage>
      <g opacity={fade}>
        <Cam cx={ip(g, [0, 30], [540, 420])} cy={1080} s={ip(g, [0, 59], [1.05, 0.98])}>
          <Sentado t={t} heat={ip(g, [24, 59], [1, 0.7])} amp={2} head={{ mouth: 'pant', brow: 'panic', sweat: 1, uid: '5cs', gorroTilt: 16, look: [-0.8 * lean, -0.2] }}
            handL={[ip(g, [14, 30], [380, 150]), ip(g, [14, 30], [1150, 820]), -30]} handR={[760, 980, 30]} blanketY={1430}
            win={win} floor
            rightItem={<g transform={`translate(780,900) rotate(${fan},0,120)`}><Almohada t={t} /></g>} />
          {/* brisa fresca que entra por la ventana */}
          {win > 0.2 && Array.from({ length: 7 }).map((_, i) => {
            const p = ((g * 5 + i * 22) % 120) / 120;
            return <path key={i} d={`M${250 + p * 700},${560 + i * 60} q60,-20 120,0 t120,0`} stroke="#bff8ff" strokeWidth={5} opacity={(1 - p) * win * 0.8} fill="none" strokeLinecap="round" />;
          })}
        </Cam>
      </g>
    </Stage>
  );
};

// =============== ESCENA 6 ===============
export const S6A: React.FC = () => {
  const f = useCurrentFrame();
  const look: [number, number] = f < 40 ? [-0.8, 0.2] : f < 80 ? [0.8, 0.4] : [0, 0.9];
  const wave = Math.sin(f / 6) * 18;
  return (
    <Stage>
      <Cam cx={ip(f, [0, 129], [540, 540])} cy={ip(f, [0, 129], [1200, 1120])} s={ip(f, [0, 129], [0.9, 1.05])}>
        <Sentado t={2} heat={0.35} amp={0} head={{ mouth: 'frown', brow: 'tired', open: 0.55, sweat: 0.5, messy: 1, gorroTilt: -14, look, uid: '6a' }}
          handL={[420, 1300, -10]} handR={[720 + wave * 0.3, 820, 20 + wave]} blanketY={1430} floor win={1} />
      </Cam>
    </Stage>
  );
};

export const S6B: React.FC = () => {
  const f = useCurrentFrame();
  // "derritiendo" ~36, "horas" ~77; al final, un escalofrío vuelve a empezar
  const s = ip(f, [0, 100], [1.15, 2.2]);
  const melt = ip(f, [36, 70], [0, 1]);
  const shakeNo = f > 70 && f < 92 ? Math.sin((f - 70) / 3) * 10 : 0;
  const coldAgain = lin(f, [100, 104], [0, 1]);
  const [jx, jy] = shake(f, coldAgain * 10, 2);
  return (
    <Stage>
      <Cam cx={540} cy={ip(f, [0, 100], [1150, 760])} s={s}>
        <Sentado t={2 - coldAgain * 2} heat={0.35 * (1 - coldAgain)} amp={0} headDy={melt * 14}
          head={{ mouth: coldAgain > 0.5 ? 'chatter' : 'frown', brow: coldAgain > 0.5 ? 'surprised' : 'tired', open: coldAgain > 0.5 ? 1 : 0.5 - melt * 0.1,
            sweat: 0.5 + melt * 0.5, messy: 1, gorroTilt: -14 + shakeNo - melt * 6, gorroOff: -melt * 30, look: f < 60 ? [0.5, 0.6] : [0, 0], uid: '6b', frost: coldAgain, blink: coldAgain < 0.5 }}
          handL={[420, 1300, -10]} handR={[720, 1300, 10]} blanketY={1430} floor win={1} />
        {coldAgain > 0 && <g transform={`translate(${jx},${jy})`}><Sparkle x={330} y={640} s={1.4} color="#e8fbff" o={coldAgain} /><Sparkle x={760} y={700} s={1.1} color="#e8fbff" o={coldAgain} /></g>}
      </Cam>
    </Stage>
  );
};
