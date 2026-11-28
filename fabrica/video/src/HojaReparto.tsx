import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { Stage } from './lib/base';
import { Barbudo } from './lib/Barbudo';
import { Persona, REPARTO } from './lib/Reparto';
const Hoja: React.FC = () => {
  const r = REPARTO;
  const fila = (y: number, items: React.ReactNode[]) => items.map((it, i) => <g key={i} transform={`translate(${180 + i * 360},${y}) scale(0.5)`}>{it}</g>);
  return (
    <Stage fondo="ciruela">
      {fila(560, [
        <Barbudo x={0} y={0} cabeza={{ boca: 'sonrisa' }} />,
        <Persona r={r.doctora} x={0} y={0} cabeza={{ boca: 'sonrisa', mira: [0.4, 0] }} brazoD={{ e: [260, 120], m: [290, -40], mano: 'señala', rot: 10 }} />,
        <Persona r={r.abuelo} x={0} y={0} cabeza={{ boca: 'sonrisa', cejas: 'cansado' }} />,
      ])}
      {fila(1150, [
        <Persona r={r.deportista} x={0} y={0} cabeza={{ boca: 'grande', sudor: 1 }} brazoI={{ e: [-260, 60], m: [-230, -110], mano: 'puño' }} />,
        <Persona r={r.nino} x={0} y={0} s={0.85} cabeza={{ boca: 'o', cejas: 'arriba' }} />,
        <Persona r={r.abuela} x={0} y={0} cabeza={{ boca: 'sonrisa', cejas: 'picaro' }} />,
      ])}
      {fila(1700, [
        <Persona r={r.oficinista} x={0} y={0} cabeza={{ boca: 'ondulada', cejas: 'cansado', parpado: 0.5 }} />,
        <Persona r={r.doctora} x={0} y={0} cabeza={{ boca: 'dientes', cejas: 'preocupado' }} />,
        <Persona r={r.abuelo} x={0} y={0} cabeza={{ boca: 'bostezo', dormido: true }} />,
      ])}
    </Stage>
  );
};
registerRoot(() => <Composition id="Video" component={Hoja} durationInFrames={30} fps={30} width={1080} height={1920} />);
