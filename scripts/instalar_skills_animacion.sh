#!/usr/bin/env bash
# Prepara las 4 skills rápidas de animación de terceros
# (artemnovitckii/claude-animation-skills, MIT): /graph, /minimalistic-graphics, /map-route, /breakdown.
#
# Las skills ya están enlazadas en .claude/skills/ (enlaces relativos versionados en git).
# Este script instala lo que no se guarda en git:
#   - kit/node_modules  (three.js, playwright, fuentes)   vía npm, sin scripts de instalación
#   - kit/vendor/gsap.min.js  (GSAP 3.12.5)               vía npm (el instalador original usa cdnjs)
# El renderizado lo hace HyperFrames (npx hyperframes@0.8.34), que se descarga en el primer uso.
set -euo pipefail
cd "$(dirname "$0")/.."
KIT=third_party/claude-animation-skills/kit

command -v ffmpeg >/dev/null || { echo "Falta ffmpeg"; exit 1; }
command -v npm >/dev/null || { echo "Falta Node.js 18+"; exit 1; }

echo "==> Dependencias npm del kit (three.js, playwright, fuentes)"
(cd "$KIT" && npm install --ignore-scripts --no-audit --no-fund --silent)

if [ ! -s "$KIT/vendor/gsap.min.js" ]; then
  echo "==> GSAP 3.12.5 (desde el paquete oficial de npm)"
  tmp=$(mktemp -d)
  (cd "$tmp" && npm pack gsap@3.12.5 --silent >/dev/null && tar xzf gsap-3.12.5.tgz)
  mkdir -p "$KIT/vendor"
  cp "$tmp/package/dist/gsap.min.js" "$KIT/vendor/gsap.min.js"
  rm -rf "$tmp"
fi

echo "==> Comprobación"
for s in graph minimalistic-graphics map-route breakdown; do
  test -f ".claude/skills/$s/SKILL.md" && echo "  [OK] /$s" || echo "  [FALTA] /$s"
done
test -f "$KIT/node_modules/three/build/three.module.js" && echo "  [OK] three.js"
test -s "$KIT/vendor/gsap.min.js" && echo "  [OK] GSAP"
echo "Listo. Primer render: HyperFrames se descargará con npx (hyperframes@0.8.34)."
