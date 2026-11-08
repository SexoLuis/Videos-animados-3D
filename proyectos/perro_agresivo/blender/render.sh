#!/usr/bin/env bash
# Renderiza la escena 1 (gancho) con Blender/Cycles y la deja como clip del proyecto:
#   ../clips/01_gancho.mp4  (1080x1920, 24 fps, 10 s)
#   ./render.sh                         # calidad de prueba: 50 % + escalado, 24 muestras
#   ESCALA=100 MUESTRAS=64 ./render.sh  # resolución nativa (mucho más lento)
set -euo pipefail
cd "$(dirname "$0")"
ESCALA=${ESCALA:-50}; MUESTRAS=${MUESTRAS:-24}; FOT=${FOT:-fotogramas}
command -v blender >/dev/null || { echo "Falta Blender: sudo apt install blender"; exit 1; }
if [ "${SOLO_CODIFICAR:-0}" != 1 ]; then
  mkdir -p "$FOT"
  blender -b --factory-startup --python escena_gancho.py -- --salida "$FOT" --muestras "$MUESTRAS" --escala "$ESCALA" \
    2>&1 | grep --line-buffered RENDER
fi
mkdir -p ../clips
# Este Blender no trae el reductor de ruido OIDN: hqdn3d limpia el ruido del trazado de rayos.
ffmpeg -v error -y -framerate 24 -i "$FOT/f%04d.png" \
  -vf "hqdn3d=3:2:8:8,scale=1080:1920:flags=lanczos,unsharp=5:5:0.4,vignette=PI/6,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -movflags +faststart ../clips/01_gancho.mp4
echo "Listo: $(cd ../clips && pwd)/01_gancho.mp4"
