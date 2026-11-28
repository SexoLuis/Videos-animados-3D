import React from 'react';
import { Composition } from 'remotion';
import { Main, TOTAL } from './Main';
export const Root: React.FC = () => (
  <Composition id="Fiebre" component={Main} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
);
