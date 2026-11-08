# Si un perro agresivo se acerca

Reel vertical de unos 30 s (3 clips de 10 s) en estilo 3D de película animada, con un
personaje original, **Nubo**, en un parque. Consejos de seguridad ante un perro agresivo.

## Flujo

```
ficha de Nubo ──► imagen de cada escena ──► clip de 10 s ──► montaje local
(texto a imagen)   (edición con la ficha     (imagen a       (voz, subtítulos, música,
                    como referencia)          vídeo)           transiciones, 9:16)
```

| Paso | Herramienta | Coste |
|---|---|---|
| 1. Ficha del personaje | fal: `google/nano-banana-2.1` | de pago (precio por confirmar antes de generar) |
| 2. Imagen de cada escena | fal: `google/nano-banana-2.1/edit` con la ficha en `image_urls` | de pago (precio por confirmar antes de generar) |
| 3. Clip de 10 s por escena | fal: `fal-ai/pixverse/v6/image-to-video` (10 s, 720p, estilo `3d_animation`) | $0.005/s → unos $0.05 por clip |
| 4. Montaje | `python3 -m videos_animados clips` (local) | gratis |

Todos los prompts y parámetros están en [`historia.json`](historia.json). Las imágenes se
guardan en `imagenes/` y los clips en `clips/`, con los nombres que indica cada escena.

## Montaje

```bash
# Prueba sin clips: usa clips provisionales para las escenas que falten
python3 -m videos_animados clips --historia proyectos/perro_agresivo/historia.json --marcadores

# Con los clips ya en clips/
python3 -m videos_animados clips --historia proyectos/perro_agresivo/historia.json
```

El resultado queda en `salida/si-un-perro-agresivo-se-acerca.mp4` (más `.srt` y `.json`).

El comando `clips`:

- recorta cada clip para llenar 1080 × 1920 a 30 fps (sin bandas negras) y descarta su audio;
- si la narración dura más que el clip, congela el último fotograma;
- añade la voz local, los subtítulos palabra a palabra (palabra activa en amarillo),
  la música con *ducking* y las transiciones de cada escena.

## Estado

- [x] Guion, personaje y prompts
- [x] Montaje probado con clips provisionales (29 s)
- [ ] Generar la ficha, las imágenes y los clips en fal (pendiente: la cuenta no tiene saldo)
