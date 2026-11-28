#!/usr/bin/env bash
# Uso: scripts/voz.sh <carpeta_del_video>
# Genera narracion.mp3 desde guion.txt con la API de ElevenLabs (voz Jarnathan).
# La clave NO va aquí: el proxy del entorno la inyecta en la cabecera xi-api-key (secreto de red para api.elevenlabs.io).
set -euo pipefail
D=$1; VOZ=${VOZ:-c6SfcYrb2t09NHXiT80T}; MODELO=${MODELO:-eleven_v4}
TEXTO=$(python3 -c "import json,sys;print(json.dumps({'text':open(sys.argv[1],encoding='utf-8').read().strip(),'model_id':sys.argv[2]}))" "$D/guion.txt" "$MODELO")
code=$(curl -sS -o "$D/narracion.mp3" -w '%{http_code}' -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOZ?output_format=mp3_44100_128" \
  -H 'xi-api-key: la-inyecta-el-proxy' -H 'Content-Type: application/json' -d "$TEXTO")
if [ "$code" != "200" ]; then echo "ElevenLabs respondió $code:"; cat "$D/narracion.mp3"; rm -f "$D/narracion.mp3"; exit 1; fi
echo "narracion.mp3 lista: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$D/narracion.mp3") s"
