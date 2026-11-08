# Titanoboa: prompts de generación de video

Son para un motor generativo de video (ManyMotions u otro: Runway, Kling, Veo, Sora…).
Hay dos variantes por escena:
- **Imagen a video (recomendada):** se parte del panel correspondiente de `referencia_paneles.png`
  (recortado a 9:16), para que la Titanoboa tenga el mismo aspecto en todas las escenas.
- **Texto a video:** para motores que no aceptan imagen de referencia, como el plugin *clipwave*
  de ManyMotions, que solo admite texto. Siempre se antepone el bloque `[ESTILO]` y el bloque `[TITANOBOA]`.

Formato de todos los clips: vertical 9:16 (1080×1920), 6–8 s, 24–30 fps, sin texto incrustado.
Los subtítulos y las medidas se añaden en el montaje.

## Bloques comunes

**[ESTILO]**
> Cinematic 3D animated film still come to life, Pixar/DreamWorks-level quality, photoreal scales and
> foliage, warm natural golden-hour lighting, volumetric light rays through jungle canopy, shallow depth
> of field, gentle film grain, rich greens and amber tones, vertical 9:16 composition.

**[TITANOBOA]** (no cambiarlo entre escenas)
> A colossal prehistoric boa (Titanoboa cerrejonensis), anatomically realistic boid snake, body as thick
> as a car tyre, olive-green to bronze scales with large dark brown saddle-shaped blotches outlined in
> black along the back, paler cream belly scales, broad heavy boa head with heat-pit-free smooth lips,
> amber-yellow eyes with vertical pupils, NOT a fantasy serpent: no horns, no frills, no glowing parts.

**[PERSONAJE]** (solo en las escenas 2 y 6, como referencia de escala)
> A friendly stylised character with a large round white head, simple big black eyes, blue t-shirt,
> black stick-thin arms and legs, sneakers, expressive cartoon face.

**Negativo / evitar:** dinosaurs, sauropods, eggs, blood, gore, text, watermark, extra heads, legs on the
snake, fantasy features, morphing scale pattern, cartoon-flat 2D.

## Escenas

### 1 · Introducción (0–7 s), panel 1
- **Imagen a video:** *The giant snake slowly rises from dense prehistoric jungle foliage toward the
  camera and opens its jaws, tongue flicking; ferns and leaves sway in a warm breeze; dust motes drift in
  the light rays; slow dolly-in, rack focus from foreground leaves to the snake's eye.*
- **Texto a video:** `[ESTILO] [TITANOBOA]` + mismo movimiento.

### 2 · Tamaño (7–15 s), panel 2
- **Imagen a video:** *Long lateral tracking shot along the enormous coiled body resting on a jungle
  path; the small character stands beside it and points up, amazed; the snake's body slowly shifts and
  breathes; leaves drift down.* (En el montaje se añade la regla animada "1,7 m" frente a "hasta 13 m".)
- **Texto a video:** `[ESTILO] [TITANOBOA] [PERSONAJE]` + mismo movimiento.

### 3 · Hábitat: Paleoceno (15–23 s), panel 3 **sin el dinosaurio del fondo**
- **Imagen a video:** *The snake swims slowly through a calm tropical swamp river, S-shaped ripples
  spreading across the water, mist over the surface, palms and broadleaf trees swaying, birds crossing the
  sky, slow crane shot rising over the swamp.* Hay que añadir al negativo: **"no dinosaurs"**.
- **Texto a video:** `[ESTILO] [TITANOBOA]` + *Paleocene tropical rainforest swamp, Colombia, 60 million
  years ago* + mismo movimiento.

### 4 · Alimentación (23–31 s), panel 4
- **Imagen a video:** *The snake ambushes a large ancient crocodile-like reptile at the water's edge and
  wraps its coils around it; the coils tighten slowly; the reptile thrashes; splashes and flying mud;
  handheld slow-motion camera, naturalistic documentary tone, no blood.*
- **Texto a video:** `[ESTILO] [TITANOBOA]` + *ambush and constriction of a dyrosaurid crocodylomorph,
  naturalistic, no blood* + mismo movimiento.

### 5 · Reproducción con cautela (31–38 s). **Corregir el panel 5: sin huevos**
- **Texto a video** (no usar el panel 5): `[ESTILO] [TITANOBOA]` + *Several newborn baby boas, already
  patterned like the adult, slither out of the leaf litter beside their resting giant mother on the jungle
  floor; soft morning light; gentle push-in; calm, tender mood.*
- Narración: hay que dejar claro que **las boas actuales son vivíparas** y que para Titanoboa no está confirmado.

### 6 · Cierre (38–45 s), panel 6
- **Imagen a video:** *At sunset the giant snake rears up beside the character sitting on a rock, both
  silhouetted against a huge orange sun over the jungle; warm haze; the camera slowly pulls back and rises
  into an epic wide shot.*
- **Texto a video:** `[ESTILO] [TITANOBOA] [PERSONAJE]` + mismo movimiento.

## Audio (para el montaje)
- **Música:** cinematográfica, tensa y épica (cuerdas graves y percusión), con un crescendo en la escena 6.
- **Ambiente:** selva (insectos, aves), agua, roce de escamas y un chapoteo en la escena 4.
- **Narración:** español latino, con el texto de `BRIEF.md`; unas 105 palabras para 45 s.
