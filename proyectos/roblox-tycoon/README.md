# Tycoon Fácil para Roblox

Un juego tycoon completo en **un solo script**. Lo pegas en Roblox Studio, le das a Play y ya tienes:

- 4 parcelas, una por jugador, que se reclaman tocando el cuadro verde
- Goteros que sueltan bloques sobre una cinta transportadora
- Un recolector que convierte cada bloque en **Dinero** (sale arriba a la derecha, en la tabla de jugadores)
- Botones verdes para comprar mejoras. Se ponen rojos si no te alcanza el dinero
- Guardado del dinero y de las compras entre partidas

## Paso a paso (sin experiencia previa)

1. **Instala Roblox Studio** desde <https://create.roblox.com> (botón *Start Creating*) e inicia sesión con tu cuenta de Roblox.
2. Abre Studio, elige **New > Baseplate**. Es un mundo vacío con suelo.
3. Si no ves los paneles laterales, ve al menú **View** y activa **Explorer** y **Properties**.
4. En el **Explorer**, busca **ServerScriptService**. Pasa el ratón por encima, pulsa el **+** y elige **Script**.
5. Se abre un editor con `print("Hello world!")`. **Borra todo** y pega el contenido completo de [`TycoonServer.lua`](TycoonServer.lua).
6. Pulsa **Play** (o F5). Camina hasta una parcela, pisa el cuadro verde y empieza a ganar dinero.

> Si algo falla, abre **View > Output**. Ahí salen los errores y el mensaje `[Tycoon] ¡Listo!` cuando todo carga bien.

## Activar el guardado

Studio no deja guardar datos hasta que lo actives:

1. Primero publica el juego: **File > Publish to Roblox**.
2. Luego entra en **Home > Game Settings > Security** y activa **Enable Studio Access to API Services**.

Sin este paso el juego funciona igual, pero el progreso se pierde al salir. En la ventana Output verás un aviso.

## Las mejoras

| Mejora | Precio | Se desbloquea con | Qué hace |
|---|---|---|---|
| Gotero básico | Gratis | Reclamar la parcela | +$1 cada 2 s |
| Gotero de bronce | $25 | — | +$3 cada 2 s |
| Paredes | $50 | — | Cierra tu parcela con el color de tu equipo |
| Gotero de plata | $150 | Gotero de bronce | +$8 cada 1,5 s |
| Mejorador x2 | $400 | Gotero de plata | Duplica el valor de cada bloque que pasa |
| Gotero de oro | $1200 | Mejorador | +$25 cada 1 s |
| Torre de la victoria | $5000 | Gotero de oro | Torre dorada con tu nombre: has ganado |

## Personalizarlo (lo más fácil de cambiar)

Todo está al principio del script:

- **`AJUSTES`**: nombre de la moneda, dinero inicial, velocidad de la cinta.
- **`MEJORAS`**: cambia `precio`, `valor` (cuánto da cada bloque), `cada` (segundos entre bloques) o `nombre`. También puedes cambiar el `color`.
- Para probar rápido, pon `DINERO_INICIAL = 10000` y lo compras todo en segundos.

## Publicarlo para que jueguen tus amigos

1. **File > Publish to Roblox**, ponle nombre y descripción.
2. En <https://create.roblox.com/dashboard/creations>, abre tu juego y cambia la privacidad a **Public**.

## Ideas para seguir

- Más goteros (añade una línea en `MEJORAS` con `tipo = "gotero"` y un `hueco` nuevo, sumando una posición a `X_GOTEROS`)
- Un botón de **Renacer** (rebirth) que reinicia el progreso a cambio de un multiplicador
- Game Passes, por ejemplo uno de dinero x2
- Música, sonidos al comprar y efectos de partículas
