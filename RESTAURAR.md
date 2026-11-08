# Cómo restaurar y continuar el proyecto `videos-animados`

Este respaldo se generó el 8 de noviembre de 2026. Se hizo porque la cuenta de GitHub
quedó suspendida y **3 commits no llegaron a subirse**. El respaldo contiene el historial completo.

## Contenido del respaldo

**`videos-animados_respaldo.zip`** (principal)
| Ruta | Qué es |
|---|---|
| `RESTAURAR.md` | este archivo |
| `MANIFIESTO.txt` | lista de todos los archivos con su SHA-256 |
| `videos-animados.bundle` | **historial git completo** (todas las ramas y commits, incluidos los 3 sin subir) |
| `videos-animados/` | copia del proyecto lista para usar, incluidos los videos generados en `salida/` |

**`videos-animados_dependencias.zip`** (opcional, para restaurar sin internet)
| Ruta | Qué es |
|---|---|
| `remotion/node_modules/` | Remotion 4.0.300 + React 18.3.1 (Linux x64) |
| `third_party/claude-animation-skills/kit/node_modules/` | three.js 0.169.0, playwright 1.49.1 y fuentes |
| `debs/` | paquetes `.deb` de espeak-ng y las voces MBROLA en español (Ubuntu 24.04, amd64) |

### Material clave
- **Sistema de videos** (Python): `videos_animados/`, con la documentación en `README.md`.
- **Skills de animación** (`/graph`, `/minimalistic-graphics`, `/map-route` y `/breakdown`): el código está en
  `third_party/claude-animation-skills/` y la activación en `.claude/skills/`, que contiene enlaces relativos.
- **Video del megalodón**: `proyectos/megalodon/megalodon_15s.mp4`. Su proyecto Remotion está en `remotion/`.
- **Titanoboa**: `proyectos/titanoboa/`, con `referencia_paneles.png`, `BRIEF.md` (guion y narración) y `PROMPTS.md`.
- **Otros videos**: `ejemplos/prueba_30s.mp4`, `salida/los-secretos-del-oceano.mp4` y `salida/el-poder-del-sueno.mp4`.

## 1 · Recuperar el repositorio con su historial

```bash
unzip videos-animados_respaldo.zip -d respaldo
git clone respaldo/videos-animados.bundle videos-animados
cd videos-animados
git checkout claude/auto-video-project-analysis-e2hcli
git log --oneline | head -5      # el commit más reciente es "Titanoboa: referencia visual y brief de producción"
```
Los videos de `salida/` no están en git (la carpeta está en `.gitignore`). Cópialos desde `respaldo/videos-animados/salida/`.

**Para publicarlo en un repositorio nuevo** (GitHub con otra cuenta, GitLab, etc.):
```bash
git remote set-url origin <URL-del-nuevo-repositorio>
git push -u origin --all
```
`ejemplos/prueba_30s.mp4` (13 MB) y los MP4 de `proyectos/` están dentro del repositorio.

## 2 · Instalar dependencias

Requisitos: Linux (Ubuntu/Debian), Python 3.10+, Node 18+ y ffmpeg.

**Con internet:**
```bash
./scripts/instalar_dependencias.sh          # ffmpeg, espeak-ng, voces MBROLA, Inter, numpy, Playwright
./scripts/instalar_skills_animacion.sh      # three.js y GSAP para las 4 skills
(cd remotion && npm install)                # Remotion
python3 -m videos_animados verificar
```

**Sin internet** (con el ZIP de dependencias):
```bash
unzip videos-animados_dependencias.zip -d deps
sudo apt install ./deps/debs/*.deb
cp -r deps/remotion/node_modules remotion/
cp -r deps/third_party/claude-animation-skills/kit/node_modules third_party/claude-animation-skills/kit/
```
Para GSAP, copia `kit/vendor/gsap.min.js` desde `respaldo/videos-animados/third_party/claude-animation-skills/kit/vendor/`.

Notas del entorno donde se construyó:
- Chromium: Playwright 1.63.0 con el navegador en `/opt/pw-browsers`. Remotion se renderizó con
  `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.
  En otra máquina basta `npx remotion render` (Remotion descarga su propio navegador).
- Las skills renderizan con `npx hyperframes@0.8.34`, que se descarga en el primer uso.

## 3 · Comprobar que todo funciona

```bash
python3 -m videos_animados generar --guion ejemplos/prueba_30s.json --vista-previa   # unos segundos
python3 -m videos_animados generar --guion ejemplos/prueba_30s.json                  # unos 1,5 min
cd remotion && npx remotion render src/index.ts Megalodon out.mp4                    # unos 40 s
```

## 4 · Continuar en una sesión nueva de Claude Code

1. Sube el repositorio a un remoto nuevo (paso 1) y abre la sesión sobre él, **o** abre Claude Code en local dentro de la carpeta restaurada.
2. En Claude Code en la nube, usa el entorno **`videos-animados`**, que permite `manymotions.com`. Si el entorno no está, créalo con ese host permitido.
3. Primer mensaje sugerido:
   > Lee RESTAURAR.md, README.md y proyectos/titanoboa/BRIEF.md y PROMPTS.md. Ejecuta
   > `python3 -m videos_animados verificar` y continúa con el documental de Titanoboa de 45 s.

### Estado del documental de Titanoboa
- **Hecho:** brief, narración, prompts por escena y correcciones paleontológicas (sin dinosaurios; las boas son vivíparas).
- **Pendiente:** generar los 6 clips con un motor de video 3D y montarlos a 45,0 s exactos, con voz, música, ambiente y subtítulos.
- **Motor:** ManyMotions, con tres plugins:
  - *clipwave video-image-maker*: **solo texto a video** (sin imagen de referencia). Hay que usar las variantes de texto de `PROMPTS.md`.
  - *anime-story-video*: historias en estilo **anime**. No encaja con el estilo 3D cinematográfico pedido.
  - *ai-video-editor*: generación de video y montaje. Necesita iniciar sesión en ManyMotions.
  - Todos consumen créditos de la cuenta de ManyMotions.
- **Voz:** la voz local (`mb-es2`, espeak-ng + MBROLA) es castellana y sintética, **no español latino**. Para voz latina hace falta otra fuente.
- **Montaje:** se puede reutilizar `remotion/src/Megalodon.tsx` como plantilla (subtítulos palabra a palabra, música con ducking y transiciones).
