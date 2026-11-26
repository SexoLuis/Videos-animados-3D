import React from 'react';
import { Composition } from 'remotion';
import { Megalodon } from './Megalodon';
import { PelosAno, DURACION } from './PelosAno';

export const Root: React.FC = () => (
  <>
    <Composition id="Megalodon" component={Megalodon} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="PelosAno" component={PelosAno} durationInFrames={DURACION} fps={30} width={1080} height={1920} />
  </>
);
