import React from 'react';
import { Composition } from 'remotion';
import * as Actual from './actual';
export const Root: React.FC = () => (
  <Composition id="Video" component={Actual.Componente} durationInFrames={Actual.TOTAL} fps={30} width={1080} height={1920} />
);
