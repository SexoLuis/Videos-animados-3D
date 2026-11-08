#!/usr/bin/env bash
# Renderiza la escena de prueba de Titanoboa con Blender/Cycles y la codifica a MP4 vertical 1080x1920.
#   ./render.sh                 # calidad de prueba: 50 % (540x960) + escalado, 32 muestras (~30 s/fotograma en 4 núcleos)
#   ESCALA=100 MUESTRAS=64 ./render.sh   # resolución nativa (mucho más lento)
set -euo pipefail
cd "$(dirname "$0")"
ESCALA=${ESCALA:-50}; MUESTRAS=${MUESTRAS:-32}; INICIO=${INICIO:-1}; FIN=${FIN:-120}
FOT=${FOT:-fotogramas}; SALIDA=${SALIDA:-titanoboa_escena_prueba.mp4}
command -v blender >/dev/null || { echo "Falta Blender: sudo apt install blender"; exit 1; }
mkdir -p "$FOT"
blender -b --factory-startup --python titanoboa_escena.py -- \
  --salida "$FOT" --muestras "$MUESTRAS" --escala "$ESCALA" --inicio "$INICIO" --fin "$FIN" 2>&1 | grep --line-buffered RENDER
# hqdn3d: reduce el ruido del trazado de rayos (temporal); lanczos+unsharp: escalado a 1080x1920;
# viñeta y grano fino de película.
ffmpeg -v error -y -framerate 24 -start_number "$INICIO" -i "$FOT/f%04d.png" \
  -vf "hqdn3d=2:1.5:7:7,scale=1080:1920:flags=lanczos,unsharp=5:5:0.5,vignette=PI/5,noise=alls=3:allf=t,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -movflags +faststart "$SALIDA"
echo "Listo: $(pwd)/$SALIDA"
