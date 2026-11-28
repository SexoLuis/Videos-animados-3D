#!/usr/bin/env bash
# Uso: scripts/render.sh <slug> [--prueba]
# Alinea, mezcla el audio y renderiza fabrica/videos/<slug>/<slug>.mp4 con la escena de video/src/videos/<slug>/Video.tsx.
# Con --prueba solo genera una hoja de contacto (sin render completo).
# Cada slug usa su propia entrada, audio y carpeta de fotogramas: se pueden lanzar varios a la vez (scripts/render_varios.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG=$1; D=videos/$SLUG; SRC=video/src/videos/$SLUG
[ -f "$D/narracion.mp3" ] && [ -f "$D/guion.txt" ] && [ -f "$SRC/Video.tsx" ] || { echo "Falta narracion.mp3, guion.txt o Video.tsx"; exit 1; }
python3 scripts/alinear.py "$D" > "$D/alineacion.txt"; grep AVISO "$D/alineacion.txt" || true
cp "$D/tiempos.json" "$SRC/tiempos.json"
TOTAL=$(grep -oP 'export const TOTAL = \K[0-9]+' "$SRC/Video.tsx")
python3 scripts/audio.py "$D" "$(python3 -c "print($TOTAL/30)")"
mkdir -p video/public/audio video/src/entradas
cp "$D/mezcla.wav" "video/public/audio/$SLUG.wav"
cat > "video/src/entradas/$SLUG.tsx" <<EOT
import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { Componente, TOTAL } from '../videos/$SLUG/Video';
registerRoot(() => <Composition id="Video" component={Componente} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />);
EOT
export ENTRY="src/entradas/$SLUG.tsx" AUDIO="audio/$SLUG.wav"
cd video
if [ "${2:-}" = "--prueba" ]; then
  export STILLS="../stills/$SLUG"; rm -rf "$STILLS" && mkdir -p "$STILLS"
  FR=$(python3 -c "print(' '.join(str(int($TOTAL*k/16)+15) for k in range(16)))")
  node stills.mjs $FR 2>&1 | grep -c ok
  ffmpeg -v error -y -pattern_type glob -i "$STILLS/f*.png" -vf "scale=270:-1,tile=8x2:padding=4" -frames:v 1 "../$D/hoja.png"
  echo "Hoja de contacto: $D/hoja.png"; exit 0
fi
# --concurrency=1 por proceso: con varias pestañas en el mismo Chromium se pierden capas del SVG en algunos fotogramas
npx remotion render "$ENTRY" Video "../$D/$SLUG.mp4" --props="{\"audio\":\"$AUDIO\"}" ${FRAMES:+--frames=$FRAMES} \
  --browser-executable=/usr/bin/google-chrome --concurrency=1 --crf=18 --gl=swangle --log=error 2>&1 | grep -iv memory || true
cd .. && python3 scripts/verificar.py "$D/$SLUG.mp4"
