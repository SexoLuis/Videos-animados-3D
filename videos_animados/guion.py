"""Guiones: carga/validación de archivos JSON y creación automática desde un texto.

Formato de guion (JSON):
{
  "titulo": "Los secretos del océano",       # nombre del video / archivo de salida
  "paleta": "oceano",                         # ver escenas.PALETAS (opcional)
  "voz": "mb-es2", "velocidad": 155, "tono": 50,   # opcional
  "musica": "auto" | "ruta/a/pista.mp3" | null,    # opcional (auto = sintetizada)
  "escenas": [
    {"tipo": "titulo", "narracion": "Texto que se lee...", "titular": "Texto en *pantalla*",
     "icono": "oceano", "etiqueta": "¿Sabías que...?", "camara": "zoom-in", "transicion": "fade"},
    ...
  ]
}
Solo `narracion` es obligatorio en cada escena; el resto se completa solo.
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

from .escenas import CAMARAS, PALETAS, TIPOS
from .plantillas.iconos import ICONOS, PALABRAS_CLAVE

TRANSICIONES = ["smoothup", "circleopen", "slideleft", "fade", "zoomin", "smoothleft", "radial", "wipeup",
                "slideup", "dissolve", "circleclose", "fadeblack", "smoothright", "horzopen"]

_RELLENO = {"y", "o", "pero", "porque", "que", "el", "la", "los", "las", "un", "una", "de", "del", "en", "a", "al",
            "por", "para", "con", "se", "es", "son", "su", "sus", "lo", "le", "les", "más", "muy", "también", "además",
            "sin", "embargo", "así", "aun", "hoy", "esto", "eso", "este", "esta", "como", "cuando", "donde", "sabías",
            "te", "tu", "mi", "nos", "ya", "no", "sí", "si", "hay", "ha", "han", "fue", "era", "ser", "puede", "pueden"}


def sin_tildes(t: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", t.lower()) if unicodedata.category(c) != "Mn")


def slug(t: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", sin_tildes(t)).strip("-")
    return s[:60] or "video"


def _coincidencias(texto: str, clave: str) -> int:
    """Cuenta apariciones de `clave` al inicio de palabra (claves cortas: palabra completa)."""
    clave = sin_tildes(clave)
    if not clave[0].isalnum():
        return texto.count(clave)
    patron = rf"\b{re.escape(clave)}\b" if len(clave) <= 4 else rf"\b{re.escape(clave)}"
    return len(re.findall(patron, texto))


def elegir_icono(texto: str, evitar: str | None = None, destacado: str = "") -> str:
    """Elige el icono cuyas palabras clave aparecen más; `destacado` (el titular) cuenta doble."""
    t, d = sin_tildes(texto), sin_tildes(destacado)
    mejor, puntos = None, 0.0
    for icono, claves in PALABRAS_CLAVE.items():
        p = sum(_coincidencias(t, c) + 2 * _coincidencias(d, c) for c in claves)
        if icono == evitar:
            p -= 0.5
        if p > puntos:
            mejor, puntos = icono, p
    return mejor or ("estrella" if evitar != "estrella" else "bombilla")


def elegir_paleta(tema: str) -> str:
    t = sin_tildes(tema)
    reglas = [("oceano", ["mar", "ocean", "agua", "pez", "playa", "ballena"]),
              ("galaxia", ["espacio", "planeta", "universo", "estrella", "galaxia", "astro", "luna"]),
              ("bosque", ["planta", "bosque", "naturaleza", "salud", "ecolog", "arbol", "animal", "comida"]),
              ("fuego", ["fuego", "volcan", "energia", "deporte", "motivacion"]),
              ("neon", ["tecnolog", "internet", "app", "futuro", "ia ", "inteligencia artificial", "videojuego"]),
              ("caramelo", ["amor", "psicolog", "mente", "emocion", "relacion"]),
              ("noche", ["sueño", "dormir", "noche", "misterio", "historia"])]
    for paleta, claves in reglas:
        if any(c in t for c in claves):
            return paleta
    nombres = list(PALETAS)
    return nombres[sum(map(ord, t)) % len(nombres)]


_CONECTORES = ["sin embargo", "por eso", "por lo tanto", "además", "también", "aun así", "así que", "mientras",
               "pero", "y", "pues", "bueno", "entonces", "de hecho", "incluso", "es decir", "en cambio", "hoy"]


def titular_desde(texto: str, max_palabras: int = 5, quitar_numero: bool = False) -> str:
    """Extrae un titular corto de una frase y resalta la palabra más significativa.

    Quita conectores iniciales, corta en la primera coma/pausa si queda largo y
    evita terminar en palabras vacías ("de", "los", "y"...).
    """
    frase = re.split(r"[.;:!?…]", texto.strip().lstrip("¿¡"))[0].strip()
    if quitar_numero:  # en escenas de dato la cifra ya va en grande: el titular es lo que sigue
        m = re.search(r"\d[\d.,]*\s*(%|por ciento)?", frase)
        if m and len(frase[m.end():].split()) >= 2:
            frase = frase[m.end():].strip()
    cambiado = True
    while cambiado:
        cambiado = False
        for c in _CONECTORES:
            if sin_tildes(frase).startswith(sin_tildes(c) + " ") or sin_tildes(frase).startswith(sin_tildes(c) + ","):
                frase = frase[len(c):].lstrip(" ,")
                cambiado = True
    trozos = [t.strip() for t in frase.split(",") if t.strip()]
    if len(trozos) > 1 and len(trozos[0].split()) < 2:
        trozos = trozos[1:]  # "Mientras duermes, tu cerebro..." → "tu cerebro..."
    if trozos and len(trozos[0].split()) >= 2:
        frase = trozos[0]
    palabras = [w.strip(",;") for w in frase.split()[:max_palabras]]
    while len(palabras) > 2 and sin_tildes(palabras[-1]) in _RELLENO:
        palabras.pop()
    if not palabras:
        return texto[:30]
    candidatas = [(len(p), i) for i, p in enumerate(palabras) if sin_tildes(p) not in _RELLENO]
    if candidatas:
        _, i = max(candidatas)
        palabras[i] = f"*{palabras[i]}*"
    t = " ".join(palabras)
    if texto.strip().endswith("?") and not quitar_numero:
        t = "¿" + t + "?"
    # mayúscula en la primera letra, saltando ¿ y *
    i = next((k for k, c in enumerate(t) if c.isalpha()), 0)
    return t[:i] + t[i].upper() + t[i + 1:]


def _dato_en(texto: str) -> str | None:
    m = re.search(r"(\d[\d.,]*)\s*(%|por ciento|millones|mil millones|km|metros|m|años|kg|grados|°C|veces)?", texto)
    if not m:
        return None
    num, unidad = m.group(1).rstrip(".,"), (m.group(2) or "")
    unidad = {"por ciento": "%", "metros": " m", "m": " m", "km": " km", "kg": " kg", "grados": "°",
              "millones": " M", "mil millones": " mil M", "años": " años", "veces": "x"}.get(unidad, unidad)
    return f"{num}{unidad}"


def completar(guion: dict) -> dict:
    """Valida el guion y rellena los campos opcionales de cada escena."""
    if not guion.get("escenas"):
        raise ValueError("El guion no tiene escenas.")
    titulo = guion.get("titulo") or guion.get("tema") or "Video"
    guion["titulo"] = titulo
    guion.setdefault("paleta", elegir_paleta(titulo + " " + " ".join(e.get("narracion", "") for e in guion["escenas"])))
    if guion["paleta"] not in PALETAS:
        raise ValueError(f"Paleta desconocida: {guion['paleta']!r}. Opciones: {', '.join(PALETAS)}")
    guion.setdefault("voz", "mb-es2")
    guion.setdefault("velocidad", 155)
    guion.setdefault("tono", 50)
    guion.setdefault("musica", "auto")
    n = len(guion["escenas"])
    icono_prev, num_punto = None, 0
    for i, e in enumerate(guion["escenas"]):
        if not e.get("narracion", "").strip():
            raise ValueError(f"La escena {i + 1} no tiene 'narracion'.")
        if "tipo" not in e:
            e["tipo"] = "titulo" if i == 0 else "cierre" if i == n - 1 and n > 2 else "punto"
        if e["tipo"] not in TIPOS:
            raise ValueError(f"Escena {i + 1}: tipo {e['tipo']!r} desconocido. Opciones: {', '.join(TIPOS)}")
        if e["tipo"] == "titulo" and not e.get("titular"):
            e["titular"] = titulo
        e.setdefault("titular", titular_desde(e["narracion"], quitar_numero=e["tipo"] == "dato"))
        if e.get("icono") and e["icono"] not in ICONOS:
            raise ValueError(f"Escena {i + 1}: icono {e['icono']!r} desconocido. Opciones: {', '.join(ICONOS)}")
        if not e.get("icono"):
            e["icono"] = elegir_icono(e["narracion"], evitar=icono_prev, destacado=e["titular"])
        icono_prev = e["icono"]
        if e["tipo"] == "punto":
            num_punto += 1
            e.setdefault("numero", num_punto)
        if e["tipo"] == "dato" and not e.get("dato"):
            e["dato"] = _dato_en(e["narracion"]) or "?"
        if e["tipo"] == "lista" and not e.get("items"):
            e["items"] = [s.strip().rstrip(".").capitalize() for s in re.split(r",|\by\b", e["narracion"]) if s.strip()][:4]
        if e.get("camara") and e["camara"] not in CAMARAS:
            raise ValueError(f"Escena {i + 1}: cámara {e['camara']!r} desconocida. Opciones: {', '.join(CAMARAS)}")
        e.setdefault("camara", CAMARAS[i % len(CAMARAS)])
        e.setdefault("transicion", TRANSICIONES[i % len(TRANSICIONES)])
    return guion


def cargar(ruta: Path) -> dict:
    with open(ruta, encoding="utf-8") as f:
        return completar(json.load(f))


def desde_texto(tema: str, texto: str, etiqueta: str = "¿Sabías que...?") -> dict:
    """Crea un guion a partir de un tema y un texto de narración libre.

    Divide el texto en frases y las agrupa en escenas de ~1-2 frases. La primera
    escena es el título; frases con cifras pasan a escenas de "dato"; las
    preguntas a escenas de "pregunta"; la última, a "cierre".
    """
    frases = [f.strip() for f in re.findall(r"[^.!?…]+[.!?…]*", re.sub(r"\s+", " ", texto)) if re.search(r"\w", f)]
    if not frases:
        raise ValueError("El texto está vacío.")
    # Agrupar frases muy cortas con la siguiente (objetivo: ~8-22 palabras por escena)
    bloques, actual = [], ""
    for f in frases:
        actual = (actual + " " + f).strip()
        if len(actual.split()) >= 9 or f.endswith("?"):
            bloques.append(actual); actual = ""
    if actual:
        if bloques and len(actual.split()) < 5:
            bloques[-1] += " " + actual
        else:
            bloques.append(actual)
    escenas = []
    for i, b in enumerate(bloques):
        e: dict = {"narracion": b}
        if i == 0:
            e.update(tipo="titulo", titular=tema, etiqueta=etiqueta)
        elif i == len(bloques) - 1 and len(bloques) > 2:
            e.update(tipo="cierre")
        elif b.rstrip().endswith("?"):
            e.update(tipo="pregunta")
        elif _dato_en(b):
            e.update(tipo="dato", dato=_dato_en(b))
        else:
            e.update(tipo="punto")
        escenas.append(e)
    return completar({"titulo": tema, "escenas": escenas})


def plantilla(tema: str) -> dict:
    """Guion de ejemplo para rellenar a mano (comando `nuevo`)."""
    return {
        "titulo": tema,
        "paleta": elegir_paleta(tema),
        "voz": "mb-es2",
        "velocidad": 155,
        "musica": "auto",
        "escenas": [
            {"tipo": "titulo", "etiqueta": "¿Sabías que...?", "titular": tema,
             "narracion": f"Hoy te cuento algo sorprendente sobre {tema.lower()}."},
            {"tipo": "punto", "titular": "Primera *idea*", "narracion": "Escribe aquí la primera idea, en una o dos frases."},
            {"tipo": "dato", "dato": "50%", "titular": "Un dato *impactante*", "narracion": "Escribe aquí un dato con una cifra."},
            {"tipo": "punto", "titular": "Segunda *idea*", "narracion": "Escribe aquí la segunda idea."},
            {"tipo": "lista", "titular": "Tres *claves*", "items": ["Clave uno", "Clave dos", "Clave tres"],
             "narracion": "Recuerda tres claves: la primera, la segunda y la tercera."},
            {"tipo": "pregunta", "titular": "¿Y tú qué *opinas*?", "narracion": "¿Lo sabías? Déjamelo en los comentarios."},
            {"tipo": "cierre", "titular": "¡Sígueme!", "cta": "Sígueme para más",
             "narracion": "Sígueme para descubrir más curiosidades como esta."},
        ],
    }
