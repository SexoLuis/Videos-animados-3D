# Documental: Titanoboa (45 s, 9:16)

Brief de producción para retomar en una sesión con ManyMotions conectado
(entorno `videos-animados`, que permite `manymotions.com`).

## Entrega
- MP4 de **exactamente 45,0 s**, 1080 × 1920, 30 fps, audio AAC a −14 LUFS y subtítulos integrados.
- Destino: `proyectos/titanoboa/titanoboa_45s.mp4`.

## Referencia visual
- `referencia_paneles.png`: 6 paneles con animación 3D cinematográfica, luz natural cálida y un personaje expresivo (cabeza blanca, camiseta azul).
- La Titanoboa debe mantenerse idéntica en todas las escenas: tonos verde oliva y bronce, manchas oscuras en forma de silla de montar, ojos amarillos y cabeza ancha de boa. Debe verse gigantesca, con anatomía de boa real (reconstrucción paleontológica), no como una serpiente fantástica.
- Se usa cada panel como imagen de partida (image-to-video) para que el diseño no cambie.

## Escenas (≈45 s)
| # | s | Escena | Panel | Movimiento |
|---|---|---|---|---|
| 1 | 0–7 | Aparece entre la vegetación | 1 | la cabeza avanza, la vegetación se mueve, la cámara empuja hacia ella |
| 2 | 7–15 | Tamaño: hasta ~13 m frente a 1,7 m | 2 | travelling lateral a lo largo del cuerpo y medidas animadas |
| 3 | 15–23 | Hábitat: pantanos y selva del Paleoceno | 3 | nada en el agua, ondas, niebla, pájaros |
| 4 | 23–31 | Alimentación: acecho y constricción | 4 | se enrosca, cámara en mano lenta (sin sangre) |
| 5 | 31–38 | Reproducción (con cautela) | 5 *(corregir)* | crías vivas, no huevos (ver notas) |
| 6 | 38–45 | Cierre al atardecer | 6 | la cámara se aleja y se eleva, la silueta contra el sol |

## Narración (español latino, tono documental), ~105 palabras
1. "Hace sesenta millones de años, en las selvas de lo que hoy es Colombia, vivía un gigante: la Titanoboa."
2. "Medía cerca de trece metros y pesaba más de una tonelada. Junto a ella, un ser humano parecería diminuto."
3. "Su mundo eran pantanos cálidos y ríos lentos, poco después de la desaparición de los dinosaurios."
4. "Acechaba desde el agua y, como las boas actuales, probablemente sujetaba a sus presas y las asfixiaba con su cuerpo."
5. "Las boas modernas dan a luz crías vivas. Es probable que Titanoboa también lo hiciera, aunque no tenemos pruebas directas."
6. "Hasta hoy, es la serpiente más grande que conocemos."

## Comprobaciones paleontológicas (correcciones sobre los paneles)
- **Edad y lugar:** Paleoceno, hace unos 58–60 millones de años, en la Formación Cerrejón (Colombia).
- **Tamaño:** se estima en unos 12,8 m (hasta 14 m según las estimaciones) y alrededor de 1.100 kg. "Hasta 13 metros" es razonable.
- **Panel 3:** al fondo aparece un saurópodo. **Es un error:** los dinosaurios no avianos se extinguieron hace 66 millones de años, antes de Titanoboa. Hay que quitarlo de la escena.
- **Panel 5:** muestra huevos eclosionando. **Las boas son vivíparas** (paren crías vivas), así que hay que representar crías recién nacidas junto a la madre y no presentarlo como un hecho comprobado para Titanoboa.
- **Presas:** probablemente sobre todo peces grandes (como peces pulmonados) y quizá cocodrilomorfos (dirosáuridos). El cocodrilo del panel 4 es plausible.

## Audio
- Voz: con ManyMotions o TTS si está disponible; si no, la voz local `mb-es2`, que **no** es español latino.
- Música cinematográfica, ambiente de selva y agua, y efectos de movimiento: ver qué ofrece ManyMotions; si no, generarlos con el proyecto.
- Subtítulos palabra por palabra, como en el resto del proyecto.
