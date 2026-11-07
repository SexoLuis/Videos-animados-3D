"""Iconos SVG propios (viewBox 200x200), con partes animables vía clases CSS.

Colores mediante variables CSS: --ink (trazo claro), --acc (acento),
--acc2 (acento secundario), --dark (sombra/oscuro).
Clases animables definidas en base.css: .spin, .spin-slow, .bob, .flicker,
.pulse, .wave, .twinkle, .tick, .blink.
"""

ICONOS: dict[str, str] = {
    "oceano": """
<defs><clipPath id="recorte-oceano"><circle cx="100" cy="100" r="80"/></clipPath></defs>
<circle cx="100" cy="100" r="80" fill="var(--acc2)" opacity=".35"/>
<g clip-path="url(#recorte-oceano)">
<circle cx="146" cy="58" r="16" fill="var(--ink)" class="pulse"/>
<g class="wave"><path d="M0 108 q22 -20 45 0 t45 0 t45 0 t45 0 t45 0 t45 0 t45 0 t45 0 v100 h-360z" fill="var(--acc)"/></g>
<g class="wave wave-b"><path d="M-45 132 q22 -18 45 0 t45 0 t45 0 t45 0 t45 0 t45 0 t45 0 t45 0 v80 h-360z" fill="var(--ink)" opacity=".92"/></g></g>
<circle cx="100" cy="100" r="80" fill="none" stroke="var(--ink)" stroke-width="7"/>""",
    "planeta": """
<g class="bob"><circle cx="100" cy="100" r="52" fill="var(--acc)"/>
<path d="M62 82 q20 10 35 -4 q14 -12 30 0" stroke="var(--dark)" stroke-width="8" fill="none" opacity=".35" stroke-linecap="round"/>
<path d="M70 120 q25 12 55 -2" stroke="var(--dark)" stroke-width="8" fill="none" opacity=".35" stroke-linecap="round"/>
<ellipse cx="100" cy="104" rx="88" ry="22" fill="none" stroke="var(--ink)" stroke-width="9" transform="rotate(-18 100 104)"/></g>
<circle cx="35" cy="40" r="5" fill="var(--ink)" class="twinkle"/><circle cx="168" cy="160" r="6" fill="var(--ink)" class="twinkle t2"/>""",
    "cohete": """
<g class="bob"><path d="M100 22 c30 25 38 65 28 105 h-56 c-10 -40 -2 -80 28 -105z" fill="var(--ink)"/>
<circle cx="100" cy="72" r="15" fill="var(--acc2)" stroke="var(--dark)" stroke-width="6"/>
<path d="M72 112 l-24 30 l30 -6z M128 112 l24 30 l-30 -6z" fill="var(--acc)"/>
<g class="flicker"><path d="M80 130 q20 55 40 0z" fill="var(--acc)"/><path d="M90 130 q10 30 20 0z" fill="#fff6c9"/></g></g>""",
    "bombilla": """
<g class="pulse"><g stroke="var(--acc)" stroke-width="9" stroke-linecap="round">
<line x1="100" y1="8" x2="100" y2="26"/><line x1="36" y1="34" x2="49" y2="47"/><line x1="164" y1="34" x2="151" y2="47"/>
<line x1="14" y1="96" x2="32" y2="96"/><line x1="186" y1="96" x2="168" y2="96"/></g></g>
<path d="M100 40 a52 52 0 0 1 30 94 v14 h-60 v-14 a52 52 0 0 1 30 -94z" fill="var(--acc)"/>
<path d="M84 120 q16 -40 32 0" stroke="var(--dark)" stroke-width="6" fill="none" opacity=".4"/>
<rect x="72" y="152" width="56" height="12" rx="6" fill="var(--ink)"/><rect x="78" y="170" width="44" height="12" rx="6" fill="var(--ink)"/>""",
    "cerebro": """
<g class="bob"><path d="M100 40 c-18 -16 -50 -6 -52 18 c-22 4 -30 30 -16 46 c-10 18 4 42 26 40 c6 18 30 22 42 8z" fill="var(--acc)"/>
<path d="M100 40 c18 -16 50 -6 52 18 c22 4 30 30 16 46 c10 18 -4 42 -26 40 c-6 18 -30 22 -42 8z" fill="var(--acc2)"/>
<path d="M100 40 v112" stroke="var(--dark)" stroke-width="5" opacity=".4"/>
<path d="M62 80 q14 6 20 -6 M70 116 q14 -8 26 4 M138 80 q-14 6 -20 -6 M130 116 q-14 -8 -26 4" stroke="var(--dark)" stroke-width="6" fill="none" opacity=".35" stroke-linecap="round"/></g>
<circle cx="168" cy="36" r="7" fill="var(--ink)" class="twinkle"/><circle cx="30" cy="160" r="6" fill="var(--ink)" class="twinkle t2"/>""",
    "corazon": """
<g class="pulse"><path d="M100 168 c-70 -46 -86 -84 -64 -112 c18 -22 50 -18 64 8 c14 -26 46 -30 64 -8 c22 28 6 66 -64 112z" fill="var(--acc)"/>
<path d="M58 72 q6 -16 22 -16" stroke="var(--ink)" stroke-width="9" fill="none" stroke-linecap="round" opacity=".8"/></g>""",
    "reloj": """
<circle cx="100" cy="104" r="76" fill="var(--ink)"/><circle cx="100" cy="104" r="62" fill="var(--acc2)" opacity=".25"/>
<g fill="var(--dark)"><circle cx="100" cy="52" r="5"/><circle cx="152" cy="104" r="5"/><circle cx="100" cy="156" r="5"/><circle cx="48" cy="104" r="5"/></g>
<g class="spin-slow" style="transform-origin:100px 104px"><rect x="96" y="66" width="8" height="42" rx="4" fill="var(--dark)"/></g>
<g class="spin" style="transform-origin:100px 104px"><rect x="97" y="50" width="6" height="58" rx="3" fill="var(--acc)"/></g>
<circle cx="100" cy="104" r="8" fill="var(--acc)"/>
<rect x="88" y="14" width="24" height="16" rx="5" fill="var(--ink)"/>""",
    "dinero": """
<g class="bob"><circle cx="100" cy="100" r="72" fill="var(--acc)"/><circle cx="100" cy="100" r="56" fill="none" stroke="var(--dark)" stroke-width="6" opacity=".3"/>
<text x="100" y="128" text-anchor="middle" font-size="86" font-weight="900" fill="var(--dark)" opacity=".75" font-family="Inter">$</text></g>
<circle cx="160" cy="40" r="8" fill="var(--ink)" class="twinkle"/><circle cx="40" cy="166" r="6" fill="var(--ink)" class="twinkle t2"/>""",
    "hoja": """
<g class="bob" style="transform-origin:100px 180px"><path d="M40 170 c0 -90 50 -140 130 -140 c0 90 -50 140 -130 140z" fill="var(--acc)"/>
<path d="M44 166 c30 -40 60 -80 112 -120" stroke="var(--dark)" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>
<path d="M80 128 l-4 -34 M108 96 l-2 -30 M96 112 l34 -2 M124 80 l30 -2" stroke="var(--dark)" stroke-width="6" opacity=".3" stroke-linecap="round"/></g>""",
    "estrella": """
<g class="spin-slow" style="transform-origin:100px 104px"><path d="M100 18 l24 52 l56 6 l-42 38 l12 56 l-50 -28 l-50 28 l12 -56 l-42 -38 l56 -6z" fill="var(--acc)"/></g>
<circle cx="100" cy="104" r="16" fill="var(--ink)" class="pulse"/>""",
    "libro": """
<g class="bob"><path d="M100 50 c-24 -16 -56 -18 -80 -10 v112 c24 -8 56 -6 80 10z" fill="var(--ink)"/>
<path d="M100 50 c24 -16 56 -18 80 -10 v112 c-24 -8 -56 -6 -80 10z" fill="var(--acc2)"/>
<path d="M36 70 q28 -6 50 4 M36 92 q28 -6 50 4 M36 114 q28 -6 50 4" stroke="var(--dark)" stroke-width="5" opacity=".3" fill="none"/>
<path d="M114 74 q28 -10 50 -4 M114 96 q28 -10 50 -4 M114 118 q28 -10 50 -4" stroke="var(--dark)" stroke-width="5" opacity=".3" fill="none"/>
<rect x="96" y="44" width="8" height="122" rx="4" fill="var(--acc)"/></g>""",
    "pregunta": """
<circle cx="100" cy="100" r="80" fill="var(--acc)"/>
<g class="bob"><text x="100" y="140" text-anchor="middle" font-size="130" font-weight="900" fill="var(--ink)" font-family="Inter">?</text></g>""",
    "rayo": """
<g class="flicker"><path d="M118 10 l-66 104 h44 l-16 76 l70 -110 h-46z" fill="var(--acc)"/></g>
<path d="M118 10 l-66 104 h44" stroke="var(--ink)" stroke-width="6" fill="none" opacity=".6" stroke-linejoin="round"/>""",
    "gota": """
<g class="bob"><path d="M100 18 c30 44 60 76 60 110 a60 60 0 0 1 -120 0 c0 -34 30 -66 60 -110z" fill="var(--acc)"/>
<path d="M72 128 a30 30 0 0 0 26 30" stroke="var(--ink)" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/></g>""",
    "sol": """
<g class="spin-slow" style="transform-origin:100px 100px"><g stroke="var(--acc)" stroke-width="12" stroke-linecap="round">
<line x1="100" y1="8" x2="100" y2="34"/><line x1="100" y1="166" x2="100" y2="192"/><line x1="8" y1="100" x2="34" y2="100"/><line x1="166" y1="100" x2="192" y2="100"/>
<line x1="35" y1="35" x2="53" y2="53"/><line x1="147" y1="147" x2="165" y2="165"/><line x1="165" y1="35" x2="147" y2="53"/><line x1="53" y1="147" x2="35" y2="165"/></g></g>
<circle cx="100" cy="100" r="50" fill="var(--acc)"/><circle cx="100" cy="100" r="34" fill="var(--ink)" opacity=".35" class="pulse"/>""",
    "luna": """
<g class="bob"><path d="M128 24 a80 80 0 1 0 50 120 a64 64 0 1 1 -50 -120z" fill="var(--acc)"/>
<circle cx="80" cy="120" r="10" fill="var(--dark)" opacity=".2"/><circle cx="104" cy="150" r="7" fill="var(--dark)" opacity=".2"/></g>
<circle cx="160" cy="50" r="6" fill="var(--ink)" class="twinkle"/><circle cx="176" cy="96" r="4" fill="var(--ink)" class="twinkle t2"/>""",
    "montana": """
<circle cx="146" cy="56" r="22" fill="var(--acc)" class="pulse"/>
<path d="M10 176 l62 -100 l40 60 l26 -34 l52 74z" fill="var(--ink)"/>
<path d="M72 76 l18 28 l-10 -4 l-8 10 l-8 -10 l-10 4z" fill="var(--acc2)"/>
<path d="M10 176 l62 -100 l40 60" fill="none" stroke="var(--dark)" stroke-width="5" opacity=".25"/>""",
    "pez": """
<g class="bob"><path d="M30 100 c30 -50 100 -50 130 0 c-30 50 -100 50 -130 0z" fill="var(--acc)"/>
<path d="M150 100 l34 -30 v60z" fill="var(--acc)"/><circle cx="66" cy="92" r="9" fill="var(--dark)"/>
<path d="M96 70 q14 30 0 60" stroke="var(--dark)" stroke-width="5" fill="none" opacity=".3"/></g>
<circle cx="36" cy="44" r="8" fill="none" stroke="var(--ink)" stroke-width="4" class="twinkle"/><circle cx="54" cy="24" r="5" fill="none" stroke="var(--ink)" stroke-width="3" class="twinkle t2"/>""",
    "persona": """
<g class="bob"><circle cx="100" cy="62" r="34" fill="var(--ink)"/>
<path d="M36 182 c0 -50 28 -76 64 -76 s64 26 64 76z" fill="var(--acc)"/></g>""",
    "grafico": """
<rect x="24" y="24" width="152" height="152" rx="18" fill="var(--ink)" opacity=".15"/>
<rect x="44" y="110" width="26" height="50" rx="6" fill="var(--acc2)" class="grow"/>
<rect x="87" y="80" width="26" height="80" rx="6" fill="var(--acc2)" class="grow g2"/>
<rect x="130" y="50" width="26" height="110" rx="6" fill="var(--acc)" class="grow g3"/>
<path d="M44 96 l44 -30 l40 14 l38 -42" stroke="var(--ink)" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>""",
    "mundo": """
<g class="spin-slow" style="transform-origin:100px 100px"><circle cx="100" cy="100" r="76" fill="var(--acc2)"/>
<path d="M60 54 q20 -8 30 10 q-4 20 -24 18 q-14 12 -6 28 q-20 -8 -26 -30 q8 -20 26 -26z M118 40 q30 6 46 40 q-14 6 -22 -4 q-18 4 -16 20 q-16 -6 -12 -26 q-14 -12 4 -30z M100 120 q24 -4 34 14 q-6 26 -30 30 q-12 -20 -4 -44z" fill="var(--acc)"/></g>
<circle cx="100" cy="100" r="76" fill="none" stroke="var(--ink)" stroke-width="6"/>""",
    "fuego": """
<g class="flicker" style="transform-origin:100px 180px"><path d="M100 14 c10 40 56 58 56 110 a56 56 0 0 1 -112 0 c0 -30 18 -40 22 -64 c14 16 16 26 18 36 c10 -26 14 -50 16 -82z" fill="var(--acc)"/>
<path d="M100 92 c6 24 30 32 30 60 a30 30 0 0 1 -60 0 c0 -18 12 -26 14 -38 c6 8 8 14 8 18 c6 -14 8 -26 8 -40z" fill="#fff3b0"/></g>""",
    "musica": """
<g class="bob"><path d="M76 40 l90 -20 v110" stroke="var(--ink)" stroke-width="12" fill="none" stroke-linejoin="round"/>
<path d="M76 40 v116" stroke="var(--ink)" stroke-width="12"/>
<ellipse cx="56" cy="156" rx="26" ry="20" fill="var(--acc)"/><ellipse cx="146" cy="132" rx="26" ry="20" fill="var(--acc)"/></g>""",
    "check": """
<circle cx="100" cy="100" r="78" fill="var(--acc)"/>
<path d="M60 102 l28 28 l54 -60" stroke="var(--ink)" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round" class="draw"/>""",
    "camara": """
<g class="bob"><rect x="22" y="56" width="156" height="110" rx="20" fill="var(--ink)"/><rect x="64" y="38" width="56" height="26" rx="8" fill="var(--ink)"/>
<circle cx="100" cy="112" r="38" fill="var(--acc2)"/><circle cx="100" cy="112" r="22" fill="var(--dark)" opacity=".6"/>
<circle cx="150" cy="80" r="8" fill="var(--acc)" class="blink"/></g>""",
    "engranaje": """
<g class="spin-slow" style="transform-origin:100px 100px">
<path d="M88 14 h24 l4 22 l18 8 l18 -14 l18 18 l-14 18 l8 18 l22 4 v24 l-22 4 l-8 18 l14 18 l-18 18 l-18 -14 l-18 8 l-4 22 h-24 l-4 -22 l-18 -8 l-18 14 l-18 -18 l14 -18 l-8 -18 l-22 -4 v-24 l22 -4 l8 -18 l-14 -18 l18 -18 l18 14 l18 -8z" fill="var(--acc)"/>
<circle cx="100" cy="100" r="30" fill="var(--dark)" opacity=".5"/></g>""",
    "comida": """
<g class="bob"><path d="M30 104 h140 a70 70 0 0 1 -140 0z" fill="var(--ink)"/>
<circle cx="72" cy="92" r="20" fill="var(--acc)"/><circle cx="104" cy="84" r="22" fill="var(--acc2)"/><circle cx="134" cy="94" r="18" fill="var(--acc)"/></g>
<g class="wave-steam" stroke="var(--ink)" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"><path d="M80 52 q-10 -12 0 -24 q10 -12 0 -24"/><path d="M118 52 q-10 -12 0 -24 q10 -12 0 -24"/></g>""",
    "telefono": """
<g class="bob"><rect x="54" y="14" width="92" height="172" rx="18" fill="var(--ink)"/><rect x="64" y="34" width="72" height="124" rx="8" fill="var(--acc2)"/>
<circle cx="100" cy="172" r="7" fill="var(--dark)" opacity=".4"/>
<path d="M100 120 c-26 -18 -30 -32 -22 -42 c7 -8 17 -6 22 3 c5 -9 15 -11 22 -3 c8 10 4 24 -22 42z" fill="var(--acc)" class="pulse"/></g>""",
    "salud": """
<g class="pulse"><rect x="70" y="20" width="60" height="160" rx="14" fill="var(--acc)"/><rect x="20" y="70" width="160" height="60" rx="14" fill="var(--acc)"/></g>
<rect x="80" y="30" width="16" height="40" rx="8" fill="var(--ink)" opacity=".5"/>""",
    "animal": """
<g class="bob"><ellipse cx="100" cy="128" rx="44" ry="38" fill="var(--acc)"/>
<ellipse cx="50" cy="78" rx="18" ry="24" fill="var(--acc)"/><ellipse cx="84" cy="54" rx="18" ry="24" fill="var(--acc)"/>
<ellipse cx="118" cy="54" rx="18" ry="24" fill="var(--acc)"/><ellipse cx="152" cy="78" rx="18" ry="24" fill="var(--acc)"/></g>""",
}

# Palabras clave (sin tildes, minúsculas) → icono, para elegir icono automáticamente.
PALABRAS_CLAVE: dict[str, list[str]] = {
    "oceano": ["mar", "oceano", "ola", "playa", "agua salada", "marino", "costa"],
    "pez": ["pez", "peces", "ballena", "tiburon", "pulpo", "criatura", "acuatico"],
    "planeta": ["planeta", "marte", "jupiter", "saturno", "sistema solar", "galaxia", "universo", "espacio"],
    "cohete": ["cohete", "nave", "despegue", "nasa", "astronauta", "lanzamiento", "rapido", "acelerar"],
    "bombilla": ["idea", "truco", "consejo", "invento", "descubr", "solucion", "luz propia", "creativ"],
    "cerebro": ["cerebro", "mente", "memoria", "pensar", "inteligen", "aprender", "neurona", "psicolog"],
    "corazon": ["corazon", "amor", "emocion", "sentir", "pareja", "cariño", "sangre"],
    "reloj": ["tiempo", "hora", "minuto", "segundo", "reloj", "rutina", "dia", "mañana", "noche", "años"],
    "dinero": ["dinero", "euro", "dolar", "ahorr", "precio", "invert", "econom", "pagar", "rico", "negocio"],
    "hoja": ["planta", "arbol", "bosque", "naturaleza", "ecolog", "verde", "hoja", "oxigeno", "selva"],
    "estrella": ["estrella", "exito", "mejor", "famoso", "brillar", "logro", "premio"],
    "libro": ["libro", "leer", "historia", "estudi", "escuela", "aprend", "cultura", "palabra"],
    "rayo": ["energia", "electric", "rayo", "tormenta", "bateria"],
    "gota": ["agua", "lluvia", "beber", "hidrat", "liquido", "rio"],
    "sol": ["sol", "calor", "verano", "luz", "clima", "temperatura"],
    "luna": ["luna", "dormir", "sueño", "noche", "descanso"],
    "montana": ["montaña", "monte", "viaje", "aventura", "cima", "escalar", "superficie", "tierra"],
    "persona": ["persona", "gente", "humano", "cuerpo", "personas", "nosotros", "tu ", "hombre", "mujer"],
    "grafico": ["por ciento", "%", "crec", "datos", "estadistic", "aument", "mitad", "porcentaje", "numero"],
    "mundo": ["mundo", "tierra", "global", "pais", "paises", "internacional", "humanidad"],
    "fuego": ["fuego", "quemar", "volcan", "caliente", "motivacion", "pasion"],
    "musica": ["musica", "cancion", "sonido", "ritmo", "cantar"],
    "camara": ["foto", "video", "camara", "imagen", "redes"],
    "engranaje": ["funciona", "maquina", "proceso", "sistema", "tecnolog", "mecanism", "trabajo"],
    "comida": ["comida", "comer", "dieta", "alimento", "cocina", "receta", "fruta"],
    "telefono": ["movil", "telefono", "app", "internet", "pantalla", "celular"],
    "salud": ["salud", "medic", "hospital", "enfermedad", "vitamina", "doctor"],
    "animal": ["animal", "perro", "gato", "mascota", "especie"],
    "pregunta": ["sabias", "por que", "como es posible", "pregunta", "misterio", "?"],
}


def svg(nombre: str, tam: int = 300, clase: str = "") -> str:
    cuerpo = ICONOS.get(nombre, ICONOS["estrella"])
    return (f'<svg class="icono {clase}" viewBox="0 0 200 200" width="{tam}" height="{tam}" '
            f'overflow="visible" xmlns="http://www.w3.org/2000/svg">{cuerpo}</svg>')
