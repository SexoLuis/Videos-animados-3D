# Fábrica de videos diarios (@CortoYCurioso)

Produce videos verticales de curiosidades del cuerpo humano en el estilo **barbudo cartoon**, de principio a fin.
El procedimiento completo está en la skill `.claude/skills/videos-diarios/SKILL.md`.

| Ruta | Qué es |
|---|---|
| `video/` | proyecto Remotion. `src/lib/` = biblioteca común; `src/videos/<slug>/Video.tsx` = escenas de cada video |
| `videos/<slug>/` | datos de cada video: `guion.txt`, `fuentes.md`, `narracion.mp3`, `eventos.json`, `tiempos.json`, MP4 |
| `scripts/alinear.py` | tiempos por palabra a partir del guion y el audio (sin servicios externos) |
| `scripts/audio.py` | música sintetizada con ducking + efectos; la voz no se altera |
| `scripts/render.sh <slug> [--prueba]` | alinea, mezcla y renderiza (o solo hoja de contacto) |
| `scripts/verificar.py` | detecta fotogramas con capas perdidas y hace la hoja final |
| `registro.md` | temas ya hechos (para no repetir) |

Requisitos: el entorno de nube **Videos-animados-3D** (permite descargar las voces de `elevenlabsusercontent.com`
e instala Remotion al arrancar) y el conector de ElevenLabs.
