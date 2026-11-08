import React from 'react';
import { Composition } from 'remotion';
import { Megalodon } from './Megalodon';

export const Root: React.FC = () => (
  <Composition id="Megalodon" component={Megalodon} durationInFrames={450} fps={30} width={1080} height={1920} />
);
