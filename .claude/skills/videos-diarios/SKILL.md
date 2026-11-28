---
name: videos-diarios
description: Produce los videos diarios de @CortoYCurioso (curiosidades del cuerpo humano, estilo barbudo cartoon) de principio a fin — elige temas del día, escribe el guion, genera la voz con ElevenLabs, anima en Remotion con la fábrica del repo, sincroniza subtítulos y entrega los MP4. Usar cuando una tarea programada o el usuario pida "los videos de hoy" o "/videos-diarios".
---

# Videos diarios de @CortoYCurioso

Tú haces TODO: temas, guion, escenas, animación y montaje. ElevenLabs solo pone la voz.
Por defecto: **3 videos**, tema **cuerpo humano**, estilo **barbudo cartoon** (skill `estilo-barbudo-cartoon`,
más la skill `marca-de-agua-cortoycurioso`). Lee las dos skills antes de empezar si están disponibles.

El video de referencia (plantilla a imitar) es `fabrica/video/src/videos/2026-11-28-sueno-despues-de-comer/Video.tsx`.
La biblioteca está en `fabrica/video/src/lib/`: `base.tsx` (cámara, fondos, subtítulos, marca, plantilla `Video`),
`Barbudo.tsx` (el barbudo y sus expresiones), `Cuerpo.tsx` (cerebro operador, estómago, corazón, pulmones,
intestino, mensajeros, rayos, ojitos) y `Escenarios.tsx` (comedor, recámara, sala de control, ventana, reloj, platos).

## 0 · Preparación
- `cd fabrica/video && npm install` si falta `node_modules`.
- Revisa los créditos de ElevenLabs con `account_get_usage`: cada video gasta ≈750 créditos. Si no alcanzan para
  los 3, haz los que alcancen y dilo en el resumen final.
- Lee `fabrica/registro.md` para **no repetir temas**.

## 1 · Elegir los temas: cosas NUEVAS, no lo típico
El usuario no quiere las curiosidades de siempre. Busca en este orden (WebSearch modo standard, varias búsquedas
en paralelo; usa `allowed_domains` para cada grupo de fuentes):
1. **Estudios de esta semana sobre el cuerpo humano**: eurekalert.org, sciencedaily.com, medicalxpress.com,
   newscientist.com, sciencenews.org, theconversation.com, agenciasinc.es, nature.com/news.
   Búsquedas tipo "researchers discover human body <mes año>", "study finds <órgano/sentido> <mes año>",
   "descubren cuerpo humano estudio <mes año>". Lo ideal: algo que se supo hace días y casi nadie ha contado.
2. **Preguntas reales de la gente**: reddit.com (r/askscience, r/explainlikeimfive, r/NoStupidQuestions) con
   "why does my body…", y "la gente también pregunta" en español.
3. **La fecha**: estación, clima, fiestas, eventos deportivos o noticias del día que tengan un ángulo corporal.

Proceso:
- Escribe **10 candidatas** en `fabrica/ideas/AAAA-MM-DD.md` con: pregunta gancho, de dónde salió (URL) y
  puntuación 1-5 en **novedad**, **gancho**, **se puede animar con personajes** y **solidez de la evidencia**.
- **Lista negra** (solo se permite si hay un estudio nuevo con un ángulo sorprendente): hipo, bostezo contagioso,
  piel de gallina, crujir los nudillos, "usamos el 10 % del cerebro", uñas o pelo que crecen tras morir,
  estornudar con los ojos abiertos, no poder hacerse cosquillas, dedos arrugados en el agua, "el corazón se
  detiene al estornudar", mariposas en el estómago, el ombligo, bostezos en general, y cualquier tema de
  `fabrica/registro.md`.
- Elige las 3 mejores con novedad ≥ 4 y suma ≥ 15. Que no se parezcan entre sí (distintos órganos o sistemas).
- Verifica cada dato con al menos una fuente confiable (el estudio original o su nota de prensa, OMS, NIH,
  Mayo Clinic, Cleveland Clinic, MedlinePlus, universidades). Si es un estudio pequeño o preliminar, dilo en el
  guion con cautela ("un estudio reciente sugiere…"). Nada de consejos médicos peligrosos.

## 2 · Guion (por video)
- Carpeta de datos: `fabrica/videos/AAAA-MM-DD-tema-corto/` (slug en minúsculas con guiones).
- `guion.txt`: **105-130 palabras** (≈45-55 s), español latino neutral, frases cortas.
  Estructura: gancho con pregunta (1-2 frases) → explicación en 3-4 pasos visualizables → remate gracioso.
- `fuentes.md`: las URLs que respaldan los datos. **Solo URLs que aparecieron en tus resultados de búsqueda o que abriste**; nunca escritas de memoria.

## 3 · Voz (ElevenLabs)
Hay dos vías; usa la que esté disponible en la sesión:
- **A) Conector de ElevenLabs** (herramientas `mcp__ElevenLabs__*`; cárgalas con ToolSearch "elevenlabs speech"):
  `creative_generate_speech` con `voice_id: c6SfcYrb2t09NHXiT80T` (Jarnathan), `model_id: eleven_v4`,
  `generations_count: 1`, y como `prompt` el texto EXACTO de `guion.txt`.
- Espera con `creative_get_flow_run_status` (respeta `poll_after_seconds`). **Nunca** repitas la llamada de
  generación para reintentar: cobra otra vez.
  Descarga el `content_url` con `curl -sSf -o narracion.mp3 "<url>"` en la carpeta del video.
- **B) Clave de API en el entorno** (secreto de red para api.elevenlabs.io): `fabrica/scripts/voz.sh fabrica/videos/<slug>`.
- Si ninguna funciona, NO inventes audio ni uses otra voz: termina el guion y las ideas, y explica en el
  resumen que falta conectar ElevenLabs (conector en la tarea programada o clave en el entorno).

## 4 · Escenas (lo más importante)
- `python3 fabrica/scripts/alinear.py fabrica/videos/<slug>` imprime cada frase con sus tiempos.
  Si sale "AVISO: ritmo raro", el guion y el audio no coinciden: corrígelo antes de seguir.
- **Elige el reparto del video** (`fabrica/video/src/lib/Reparto.tsx`, hoja de referencia `fabrica/reparto.png`).
  No uses siempre al barbudo: el protagonista se escoge según el tema y **rota entre días** (revisa la columna
  «Protagonista» de `fabrica/registro.md` para no repetir el de los 2 videos anteriores). Puede haber
  secundarios (p. ej. la Dra. Lupe explicando y el barbudo sufriendo).
  | Personaje | Uso | Código |
  |---|---|---|
  | El barbudo | protagonista general, comedia | `<Barbudo …/>` (`Barbudo.tsx`) |
  | Dra. Lupe | explica, examina, "la ciencia dice" | `<Persona r={REPARTO.doctora} …/>` |
  | Don Chema | envejecimiento, memoria, articulaciones, sueño ligero | `REPARTO.abuelo` |
  | Vale | ejercicio, músculos, sudor, corazón, respiración | `REPARTO.deportista` |
  | Tito | crecimiento, dientes, huesos, infancia, golosinas | `REPARTO.nino` (usar `s={0.85}`) |
  | Doña Rosa | cocina, digestión, remedios caseros y mitos | `REPARTO.abuela` |
  | El Godín | estar sentado, estrés, vista cansada, café, oficina | `REPARTO.oficinista` |
  `<Persona>` tiene la misma API que `<Barbudo>` (hombros en x,y; `cabeza={{ boca, cejas, mira, parpado, sudor, dormido… }}`;
  `brazoI`/`brazoD`). Si un tema pide un personaje nuevo, créalo como un `Rasgos` más en `REPARTO` (mismo estilo).
- Planea **12-16 planos de 2-5 s**. Cada plano muestra **literalmente** lo que dice la voz en ese momento.
  Corte = justo antes de que empiece la frase (tiempo × 30 = fotograma). Alterna: barbudo en su situación →
  interior del cuerpo con personajes → barbudo reaccionando → remate final mirando a cámara.
- Crea `fabrica/video/src/videos/<slug>/Video.tsx` copiando la estructura de la plantilla: `TOTAL` = (duración
  del audio + ~1,8 s) × 30, `PLANOS`, `CLAVES` (palabras clave a resaltar, 1-2 por frase) y `Componente`.
  Reutiliza la biblioteca; crea en el propio archivo los personajes nuevos que el tema necesite (mismo estilo:
  colores planos, contorno INK de 6 px, ojitos con brillo, reacciones exageradas).
- Todo se mueve en todo momento: cámara (`Cam` con zoom/paneo), parpadeos, rebotes, pop de entrada.
- **Zooms y transiciones** (ya los pone la plantilla `Video`):
  - Cada plano tiene un acercamiento lento automático, y hay un **golpe de zoom** automático en la primera
    palabra clave de cada frase. Dentro de los planos, usa además zooms de cámara con intención: acercamiento
    rápido a una cara en la reacción, alejamiento para revelar algo, paneo siguiendo una acción, `shake` en impactos.
  - Cada plano declara su transición de entrada como tercer elemento: `[inicio, Plano, 'zoom']`. Opciones:
    `zoom` (entrar al cuerpo o acercarse a un detalle), `barrido` (cambio rápido de lugar o de idea),
    `empuje` (subir o bajar por el cuerpo), `iris` (revelar o enfocar algo), `destello` (giro, sorpresa, remate),
    `fundido` (paso de tiempo o momento tranquilo). Varíalas: no repitas la misma más de 2 veces seguidas.
- **Subtítulos**: usa los de la plantilla, estilo **contorno** (elegido por el usuario: letra gruesa blanca con
  contorno negro, la palabra que suena crece un poco, la clave en amarillo suave), **aunque la skill de estilo
  diga recuadro verde lima**: el usuario pidió subtítulos presentables que no opaquen el video.
  En `CLAVES` pon pocas palabras (las de verdad importantes): solo se resalta una por frase.
- Prohibido: diálogos, bocas que se mueven como si hablaran, texto dentro de las escenas (salvo cifras), arte
  importante por encima de y≈430 (zona de subtítulos) o tapando caras.
- Si un componente de la biblioteca te sirvió y es genérico, muévelo a `lib/` para los próximos videos.
- `fabrica/videos/<slug>/eventos.json`: efectos sincronizados `[{"t": s, "sfx": nombre, "g": ganancia, "d": dur}]`
  (lista de efectos en `fabrica/scripts/audio.py`). Los efectos van suaves: no subas la ganancia por encima de 1.
- `fabrica/videos/<slug>/ambientes.json`: **sonido de fondo según la escena**, distinto en cada video:
  `[{"desde": s, "hasta": s, "tipo": "comedor"}, ...]`. Tipos: comedor, noche, lluvia, cuerpo, control, calle,
  cocina, gimnasio, oficina, naturaleza. Cubre todo el video, cambiando de ambiente cuando cambia el lugar.

## 5 · Revisión y render (los 3 a la vez)
- Por cada video: `fabrica/scripts/render.sh <slug> --prueba` → mira `fabrica/videos/<slug>/hoja.png` con Read y
  corrige caras tapadas, arte bajo los subtítulos, personajes cortados, marca de agua ilegible y planos vacíos.
- **No hagas el render final de cada video por separado.** Cuando los 3 tengan su hoja de contacto aprobada,
  renderízalos juntos en segundo plano:
  `fabrica/scripts/render_varios.sh <slug1> <slug2> <slug3>` (≈15-20 min en total; cada uno deja `videos/<slug>/render.log`).
  Cada línea final debe decir `sospechosos: ninguno`; si un video falla, vuelve a lanzar solo ese con
  `fabrica/scripts/render.sh <slug>`. Mira cada `<slug>_hoja.png` antes de entregar.

## 6 · Entrega
- Añade cada tema a `fabrica/registro.md` (fecha, slug, título, gancho, protagonista).
- Haz commit (sin los MP4 ni mezcla.wav, que están en .gitignore) y push a la rama de la sesión.
- Envía cada MP4 con `SendUserFile` (status `proactive`, display `render`) con un pie de una línea con el título.
- Resumen final corto: los 3 títulos, la ruta de cada MP4, los créditos de ElevenLabs gastados/restantes y
  cualquier cosa que no salió.
