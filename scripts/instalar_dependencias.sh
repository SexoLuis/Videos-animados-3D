#!/usr/bin/env bash
# Instala las dependencias de videos-animados (Debian/Ubuntu). Todo es gratuito y local.
set -euo pipefail
cd "$(dirname "$0")/.."

SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

echo "==> Paquetes del sistema: ffmpeg, espeak-ng y voces MBROLA en español"
$SUDO apt-get update -qq
DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq ffmpeg espeak-ng mbrola \
  mbrola-es1 mbrola-es2 mbrola-es3 mbrola-es4 fonts-inter python3-numpy

echo "==> Playwright (Node) + Chromium para renderizar las escenas"
if node -e "require('playwright')" 2>/dev/null; then
  echo "    playwright ya está disponible"
else
  npm install
  npx playwright install --with-deps chromium
fi

echo "==> Comprobación"
python3 -m videos_animados verificar
