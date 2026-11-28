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

## 1 · Elegir los temas (curiosidades del cuerpo humano)
- Busca con WebSearch (modo standard, varias búsquedas en paralelo): noticias de salud y ciencia de esta semana,
  lo que pasa en la fecha (temporada, clima, fiestas, eventos deportivos), y preguntas virales tipo "¿por qué…?".
- Elige 3 temas con **gancho fuerte** (pregunta que todos se han hecho, mito que se desmiente, dato sorprendente)
  y que se puedan **contar con personajes y situaciones**, no con gráficas. Prioriza: actualidad > temporada > clásico viral.
- Verifica cada dato con al menos una fuente confiable (OMS, NIH, Mayo Clinic, MedlinePlus, revistas científicas,
  universidades). Si algo es incierto, dilo con cautela ("podría", "se cree"). Nada de consejos médicos peligrosos.

## 2 · Guion (por video)
- Carpeta de datos: `fabrica/videos/AAAA-MM-DD-tema-corto/` (slug en minúsculas con guiones).
- `guion.txt`: **105-130 palabras** (≈45-55 s), español latino neutral, frases cortas.
  Estructura: gancho con pregunta (1-2 frases) → explicación en 3-4 pasos visualizables → remate gracioso.
- `fuentes.md`: las URLs que respaldan los datos. **Solo URLs que aparecieron en tus resultados de búsqueda o que abriste**; nunca escritas de memoria.

## 3 · Voz (ElevenLabs)
- `creative_generate_speech` con `voice_id: c6SfcYrb2t09NHXiT80T` (Jarnathan), `model_id: eleven_v4`,
  `generations_count: 1`, y como `prompt` el texto EXACTO de `guion.txt`.
- Espera con `creative_get_flow_run_status` (respeta `poll_after_seconds`). **Nunca** repitas la llamada de
  generación para reintentar: cobra otra vez.
- Descarga el `content_url` con `curl -sSf -o narracion.mp3 "<url>"` en la carpeta del video.

## 4 · Escenas (lo más importante)
- `python3 fabrica/scripts/alinear.py fabrica/videos/<slug>` imprime cada frase con sus tiempos.
  Si sale "AVISO: ritmo raro", el guion y el audio no coinciden: corrígelo antes de seguir.
- Planea **12-16 planos de 2-5 s**. Cada plano muestra **literalmente** lo que dice la voz en ese momento.
  Corte = justo antes de que empiece la frase (tiempo × 30 = fotograma). Alterna: barbudo en su situación →
  interior del cuerpo con personajes → barbudo reaccionando → remate final mirando a cámara.
- Crea `fabrica/video/src/videos/<slug>/Video.tsx` copiando la estructura de la plantilla: `TOTAL` = (duración
  del audio + ~1,8 s) × 30, `PLANOS`, `CLAVES` (palabras clave a resaltar, 1-2 por frase) y `Componente`.
  Reutiliza la biblioteca; crea en el propio archivo los personajes nuevos que el tema necesite (mismo estilo:
  colores planos, contorno INK de 6 px, ojitos con brillo, reacciones exageradas).
- Todo se mueve en todo momento: cámara (`Cam` con zoom/paneo), parpadeos, rebotes, pop de entrada.
- Prohibido: diálogos, bocas que se mueven como si hablaran, texto dentro de las escenas (salvo cifras), arte
  importante por encima de y≈430 (zona de subtítulos) o tapando caras.
- Si un componente de la biblioteca te sirvió y es genérico, muévelo a `lib/` para los próximos videos.
- `fabrica/videos/<slug>/eventos.json`: efectos sincronizados `[{"t": s, "sfx": nombre, "g": ganancia, "d": dur}]`
  (lista de efectos en `fabrica/scripts/audio.py`).

## 5 · Revisión y render
- `fabrica/scripts/render.sh <slug> --prueba` → mira `fabrica/videos/<slug>/hoja.png` con Read y corrige:
  caras tapadas, arte bajo los subtítulos, personajes cortados, marca de agua ilegible, planos vacíos.
- `fabrica/scripts/render.sh <slug>` → render final (≈10-15 min, concurrency 1 a propósito). Debe terminar con
  `sospechosos: ninguno`. Mira `<slug>_hoja.png` antes de entregar.

## 6 · Entrega
- Añade cada tema a `fabrica/registro.md` (fecha, slug, título, gancho).
- Haz commit (sin los MP4 ni mezcla.wav, que están en .gitignore) y push a la rama de la sesión.
- Envía cada MP4 con `SendUserFile` (status `proactive`, display `render`) con un pie de una línea con el título.
- Resumen final corto: los 3 títulos, la ruta de cada MP4, los créditos de ElevenLabs gastados/restantes y
  cualquier cosa que no salió.
