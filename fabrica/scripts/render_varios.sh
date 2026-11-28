#!/usr/bin/env bash
# Uso: scripts/render_varios.sh <slug1> <slug2> <slug3> ...
# Renderiza varios videos A LA VEZ (un proceso por video, cada uno con una sola pestaña de Chromium).
# Escribe el registro de cada uno en videos/<slug>/render.log y termina con el resultado de verificar.py de cada video.
set -uo pipefail
cd "$(dirname "$0")/.."
pids=()
for s in "$@"; do scripts/render.sh "$s" > "videos/$s/render.log" 2>&1 & pids+=($!); done
fallos=0
for i in "${!pids[@]}"; do
  wait "${pids[$i]}" || fallos=$((fallos + 1))
  echo "== ${@:$((i + 1)):1}: $(tail -1 "videos/${@:$((i + 1)):1}/render.log")"
done
exit $fallos
