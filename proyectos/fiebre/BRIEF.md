# Curiosidad: ¿Por qué sentimos frío cuando tenemos fiebre? (≈1:15, 9:16)

## Entrega
- MP4 1080 × 1920, 30 fps, duración = la del audio de narración (≈75 s), sin acelerar ni alterar el audio.
- Subtítulos grandes sincronizados palabra a palabra, con palabras clave resaltadas.
- Marca de agua **@CortoYCurioso** centrada abajo (por encima de la zona de subtítulos). Ningún otro texto en las escenas.
- Destino: `proyectos/fiebre/fiebre_75s.mp4`.

## Estilo (el ya establecido, no reinventar)
Animación 3D cinematográfica · Glow oscuro con iluminación intensa · azul (frío) vs. rojo/naranja (calor) ·
personajes expresivos y exageración humorística · cámara dinámica · escenarios detallados · nada estático.
**Prohibido:** diálogos, bocas que se mueven como si hablaran, texto/números dentro de la escena, gráficos y flechas en exceso.

## Personaje principal (idéntico en todas las escenas)
Hombre de unos 35 años, complexión media, piel clara, pelo castaño corto y alborotado, barba de dos días,
ojos grandes y expresivos, **nariz roja**. Pijama de franela a rayas azul marino y gris,
**gorro de lana gris con pompón rojo**. Cama de madera, tres cobijas (azul, a cuadros rojos y crema) y almohada blanca.
Habitación: ventana con lluvia a la izquierda de la cama, mesita de noche con lámpara, vaso de agua y termómetro.

## Operador del cerebro (escenas 2 y 5)
Pequeño técnico caricaturesco, redondito, con overol naranja, casco y auriculares, ojos grandes; sala de control
futurista con un **termostato gigante sin números** (columna de luz que sube de azul a rojo) y una palanca grande.

## Escenas y planos (sincronizados con `narracion.mp3`, 52,85 s)
El audio dura **52,85 s**, no 1:15: el video dura lo mismo que la narración.
El orden sigue a la narración (las manos y pies helados se mencionan antes de "los temblores producen calor").

| # | Tiempo | Plano | Narración | Imagen |
|---|---|---|---|---|
| 1 | 0,00–3,45 | 1A | "¿Por qué cuando tienes fiebre sientes que te estás congelando," | Plano general, zoom rápido: tiembla bajo 3 cobijas, luz azul, lluvia en la ventana |
| 1 | 3,45–5,60 | 1B | "aunque tu cuerpo esté ardiendo?" | Primer plano: dientes castañean, glow rojo bajo la piel, se tapa hasta la cabeza |
| 2 | 5,60–8,00 | 2A | "Esto pasa porque, cuando te enfermas," | La cámara atraviesa la frente hasta el cerebro: sala de control azul |
| 2 | 8,00–11,60 | 2B | "tu cerebro cambia la temperatura que quiere mantener en tu cuerpo." | El operador vigila el termostato gigante; salta la alarma |
| 2 | 11,60–16,20 | 2C | "Es como si tu termostato pasara de 37 a 39 grados." | Sube la palanca: la columna de luz sube, todo pasa de azul a rojo |
| 2 | 16,20–21,55 | 2D | "Entonces, aunque ya estés caliente, tu cerebro siente que todavía te falta calor." | El operador, alarmado, aporrea botones de emergencia mientras el personaje ya brilla de calor |
| 3 | 21,55–24,60 | 3A | "Por eso empiezas a temblar, te pones más cobijas" | En la cama: empieza a temblar y se echa otra cobija encima |
| 4 | 24,60–27,85 | 4A+4B | "y hasta tus manos y pies pueden sentirse helados." | Vasos bajo la piel que se estrechan → se toca los pies y las manos, sorprendido |
| 3 | 27,85–31,20 | 3B | "Tu cuerpo está intentando alcanzar esa nueva temperatura," | Músculos 3D como motores, pulsos rojos en cada contracción |
| 3 | 31,20–34,10 | 3C | "y los temblores son una forma de producir calor." | Tiembla tanto que la cama vibra y la almohada salta |
| 5 | 34,10–38,90 | 5A | "Pero cuando la fiebre comienza a bajar, tu cerebro vuelve a ajustar ese termostato." | Sala de control: baja la palanca, apaga la calefacción, activa el enfriamiento (cian) |
| 5 | 38,90–41,90 | 5B | "Y entonces ocurre lo contrario: empiezas a sudar," | Empapado de sudor, se arranca las cobijas una por una |
| 5 | 41,90–45,20 | 5C | "te quitas las cobijas y ya no soportas el calor." | Se abanica con la almohada y abre la ventana |
| 6 | 45,20–49,50 | 6A | "Por eso, cuando tienes fiebre, puedes pasar de sentir que te estás congelando" | Sentado, despeinado, cobijas por el suelo, termómetro, mira alrededor |
| 6 | 49,50–52,85 | 6B | "a sentir que te estás derritiendo, en cuestión de horas." | Acercamiento lento al rostro: resignación, movimiento de cabeza, mirada a cámara |

Los tiempos por palabra están en `tiempos.json` (generado por `alinear.py` a partir de `guion.txt` y del audio).

## Flujo de producción
1. Audio de narración del usuario → transcripción con tiempos por palabra → ajustar los cortes de la tabla.
2. Hoja de personaje (imagen) → aprobación del usuario.
3. Un fotograma clave por plano (edición de imagen con la hoja de personaje como referencia, para mantener la identidad).
4. Image-to-video por plano, sin audio generado.
5. Montaje en Remotion: cortes exactos al audio, transiciones, subtítulos, marca de agua, −14 LUFS.

## Pendiente
- [x] Audio de narración (`narracion.mp3`, 52,85 s).
- [ ] Aprobación del gasto en fal (imágenes + video).
