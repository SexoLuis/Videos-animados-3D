# videos-animados

Sistema automatizado para crear **videos animados verticales (1080 × 1920, 9:16)** listos para
Reels, TikTok y YouTube Shorts: escenas animadas en HTML/CSS/SVG, narración en español,
subtítulos sincronizados palabra a palabra, música de fondo con *ducking*, transiciones y
movimientos de cámara. **Todo es gratuito y local**: no usa ninguna API de pago ni servicio externo.

```
guion (JSON o texto) ─► narración TTS ─► línea de tiempo ─► escenas HTML ─► Chromium ─► clips
                              │                                                  │
                              └─► subtítulos ASS ──► FFmpeg: xfade + subtítulos + música (ducking) ─► MP4
```

## Instalación

Requisitos: Linux (Debian/Ubuntu), Python 3.10+, Node 18+.

```bash
./scripts/instalar_dependencias.sh     # ffmpeg, espeak-ng, voces MBROLA, Inter, numpy, Playwright
python3 -m videos_animados verificar    # comprueba que todo está en su sitio
```

| Componente | Para qué | Instalación |
|---|---|---|
| ffmpeg (con libass) | montaje, transiciones, subtítulos, audio | `apt install ffmpeg` |
| espeak-ng + MBROLA | voz en español (TTS local) | `apt install espeak-ng mbrola mbrola-es2` |
| Node + Playwright + Chromium | renderizar las escenas HTML fotograma a fotograma | `npm install && npx playwright install chromium` |
| numpy | audio (narración, música sintetizada) | `apt install python3-numpy` o `pip install numpy` |
| Fuente Inter | tipografía de escenas y subtítulos | `apt install fonts-inter` |

## Uso rápido

### 1. Desde un tema y un texto (división automática en escenas)

```bash
python3 -m videos_animados generar --tema "El poder del sueño" --texto-archivo ejemplos/sueno.txt
# o con el texto directamente:
python3 -m videos_animados generar --tema "El océano" --texto "El océano cubre el 70% de la Tierra. ..."
```

El texto se divide en escenas de 1-2 frases. La primera es el título, las frases con cifras
se convierten en escenas de "dato" con contador animado, las preguntas en escenas de "pregunta"
y la última en el cierre. Los titulares y los iconos se eligen automáticamente.

> **Duración:** a la velocidad por defecto (155 palabras/minuto), un texto de **120-140 palabras**
> da un video de **50-60 s**. El programa avisa si la duración final queda fuera de ese rango.

> **Sobre "solo el tema":** escribir el guion entero a partir únicamente de un tema requiere un modelo
> de lenguaje, que no forma parte de esta versión gratuita y local. Puedes escribir el texto tú
> (o pedirlo a cualquier asistente) y pasarlo con `--texto`.

### 2. Desde un guion JSON (control total, mejor resultado)

```bash
python3 -m videos_animados nuevo --tema "Los volcanes"            # crea guiones/los-volcanes.json
# edita el archivo y después:
python3 -m videos_animados generar --guion guiones/los-volcanes.json
```

### 3. Vista previa rápida

Antes de renderizar todo (1,5-3 min), genera una imagen por escena en unos segundos:

```bash
python3 -m videos_animados generar --guion ejemplos/prueba_30s.json --vista-previa
```

### Resultado

En `salida/` se crean:

- `<titulo>.mp4`: el video final (H.264 + AAC 48 kHz, 30 fps, sonoridad normalizada a −14 LUFS).
- `<titulo>.srt`: los subtítulos, por si quieres subirlos aparte a YouTube o TikTok.
- `<titulo>.json`: el guion resuelto, con los tiempos de cada escena.

## Opciones de `generar`

| Opción | Descripción |
|---|---|
| `--guion f.json` | guion JSON |
| `--tema "..."` + `--texto "..."` / `--texto-archivo f.txt` | modo automático |
| `-o salida.mp4` | ruta del video (por defecto `salida/<titulo>.mp4`) |
| `--voz` | `mb-es2` (por defecto, masculina), `mb-es1` (masculina), `mb-es3` (femenina), `mb-es4`, `es` (espeak) |
| `--velocidad 155` | palabras por minuto **reales** (150-165 es un ritmo natural) |
| `--paleta` | `oceano`, `atardecer`, `bosque`, `galaxia`, `neon`, `fuego`, `caramelo`, `noche` |
| `--musica pista.mp3` | música propia (se repite si es corta y se le aplica fundido) |
| `--sin-musica` | sin música |
| `--volumen-musica 0.30` | volumen de la música antes del ducking |
| `--vista-previa` | solo una imagen por escena |
| `--conservar` | conserva los intermedios (HTML de cada escena, clips, audio) en `salida/<titulo>_trabajo/` |
| `--paralelo N` | escenas renderizadas en paralelo (por defecto, número de núcleos, máx. 4) |
| `--mostrar-guion` | imprime el guion completo (útil en modo automático para luego editarlo) |

## Formato del guion

```json
{
  "titulo": "Los secretos del océano",
  "paleta": "oceano",
  "voz": "mb-es2",
  "velocidad": 155,
  "musica": "auto",
  "escenas": [
    {"tipo": "titulo", "etiqueta": "¿Sabías que...?", "titular": "Los secretos del *océano*",
     "icono": "oceano", "narracion": "¿Sabías que el océano esconde más secretos que el espacio?"},
    {"tipo": "dato", "dato": "70%", "titular": "del planeta es *océano*",
     "narracion": "Cubre el setenta por ciento de la Tierra."}
  ]
}
```

- `musica`: `"auto"` (música sintetizada por código, distinta para cada título), una ruta a un archivo o `null`.
- En cada escena, solo **`narracion`** es obligatoria. Todo lo demás se completa automáticamente si falta.
- En `titular`, lo que escribas entre `*asteriscos*` se pinta con el color de acento.

### Tipos de escena

| `tipo` | Qué muestra | Campos propios |
|---|---|---|
| `titulo` | etiqueta + icono grande con anillos + titular | `etiqueta` |
| `punto` | número + tarjeta con icono + titular | `numero` (automático) |
| `dato` | cifra grande con contador animado; si es %, con anillo de progreso | `dato` (`"70%"`, `"11.000 m"`, `"3x"`…) |
| `lista` | titular + elementos que aparecen uno tras otro | `items` (2-4), `icono_items` |
| `pregunta` | signo de interrogación grande + titular | |
| `cierre` | icono + titular + botón de llamada a la acción | `cta` |

Campos comunes opcionales:

- `icono`: uno de `oceano, planeta, cohete, bombilla, cerebro, corazon, reloj, dinero, hoja, estrella, libro, pregunta, rayo, gota, sol, luna, montana, pez, persona, grafico, mundo, fuego, musica, check, camara, engranaje, comida, telefono, salud, animal`.
- `camara`: uno de `zoom-in, zoom-out, pan-izq, pan-der, subir, bajar, ken-burns, inclinar, empuje`.
- `transicion`: la transición hacia esa escena. Acepta cualquier transición del filtro `xfade` de FFmpeg (`fade, smoothup, circleopen, slideleft, zoomin, radial, wipeup, dissolve…`).

## Cómo funciona

| Módulo | Función |
|---|---|
| `videos_animados/tts.py` | Voz con espeak-ng + MBROLA. La tabla de fonemas de espeak emite símbolos que las voces MBROLA españolas no tienen (vocales tónicas `e/`, `h` en lugar de `r`, `R2`…), lo que provocaba silencios a mitad de palabra. El módulo corrige el archivo `.pho` antes de sintetizar. Cada frase se sintetiza por separado para conocer sus tiempos exactos; dentro de cada frase, el tiempo se reparte entre las palabras según su longitud. |
| `videos_animados/escenas.py` + `plantillas/` | Plantillas HTML/CSS/SVG para cada tipo de escena: fondo con degradados, partículas, cámara, entradas animadas y 30 iconos SVG propios con partes animadas. |
| `videos_animados/render.cjs` | Playwright: pausa todas las animaciones CSS, las sitúa en el instante exacto de cada fotograma (`document.getAnimations()`) y envía las capturas a ffmpeg. El resultado es determinista: el mismo guion produce el mismo video. |
| `videos_animados/subtitulos.py` | Subtítulos ASS en bloques de hasta 3 palabras, con la palabra que se está diciendo resaltada, y exportación a SRT. |
| `videos_animados/musica.py` | Música generada con numpy (pad, bajo, arpegio, bombo, hi-hat). La tonalidad, la progresión y el tempo dependen del título. |
| `videos_animados/montaje.py` | FFmpeg: `xfade` entre escenas, `ass` para los subtítulos, `sidechaincompress` para el ducking (la música baja unos 12 dB cuando habla el narrador) y `loudnorm` a −14 LUFS. |
| `videos_animados/pipeline.py` | Orquesta las etapas. Cada escena dura lo que su narración más los márgenes de entrada, salida y transición. |

**Rendimiento** (4 núcleos, sin GPU): un video de 55 s tarda unos 3 minutos y uno de 30 s, unos 1,5 minutos.
El rasterizado de Chromium por CPU es el paso más lento.

## Limitaciones conocidas

- **Calidad de voz:** MBROLA suena claramente sintética, aunque se entiende bien. `mb-es3` (femenina)
  no tiene los sonidos `ch`, `ñ`, `ll` ni `z`, y los sustituye por aproximaciones. Las voces neuronales
  locales (por ejemplo, Piper) suenan mucho mejor, pero sus modelos se descargan de HuggingFace, que no
  estaba accesible en el entorno donde se construyó esto. El módulo `tts.py` está aislado para poder
  añadir ese motor más adelante.
- **Tiempos por palabra:** los límites de cada frase son exactos, pero dentro de una frase el tiempo de
  cada palabra es aproximado (se reparte según su longitud).
- **Guion automático:** sin un modelo de lenguaje, los titulares e iconos automáticos son aproximados.
  Para un resultado óptimo, revisa el JSON (usa `--mostrar-guion` para ver lo que se generó).

## Ejemplos

- `ejemplos/prueba_30s.json`: guion de prueba (~31 s). El video resultante está en `ejemplos/prueba_30s.mp4`.
- `ejemplos/sueno.txt`: texto para el modo automático (~55 s).

## Skills de animación para Claude Code (terceros)

El proyecto incluye cuatro skills de [artemnovitckii/claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills)
(licencia MIT, fijadas al commit `5dbea55`) para generar animaciones cortas de 1080 × 1920 desde Claude Code:

| Skill | Qué hace | Ejemplo |
|---|---|---|
| `/graph` | gráfico de línea que se dibuja mientras un número sube | `/graph 0 a 100K seguidores en 9 meses: 1.2K, 3.4K, 9K, 24K, 51K, 100K` |
| `/minimalistic-graphics` | arte lineal en blanco y negro con una frase | `/minimalistic-graphics cada paso parece pequeño hasta que miras atrás` |
| `/map-route` | ruta sobre un mapa 3D con pin y tiempo estimado | `/map-route de casa al gimnasio, 2,8 km, 9 minutos` |
| `/breakdown` | vista 3D de un objeto despiezado con etiquetas | `/breakdown mi móvil, cada pieza etiquetada` |

- El código está en `third_party/claude-animation-skills/`. Las skills se activan desde `.claude/skills/`, que contiene enlaces relativos a esa carpeta.
- Para prepararlas después de clonar el repositorio: `./scripts/instalar_skills_animacion.sh`. El script instala three.js y GSAP. HyperFrames, que es quien renderiza, se descarga con `npx` la primera vez que se usa una skill.
- Para ver los resultados en movimiento, visita la [página de demostración](https://novitckii.com/resources/animation-skills/).
- No se incluyen `/stick-figure` ni `/zach-d-films`: según la documentación de los modelos, su alineación de palabras (Parakeet v2) solo reconoce inglés, y además necesitan unos 1 GB de modelos.
