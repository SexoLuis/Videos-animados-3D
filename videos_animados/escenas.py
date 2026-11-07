"""Construcción de escenas HTML/CSS/SVG y renderizado a video con Chromium.

Cada escena es una página HTML de 1080x1920 cuyas animaciones son CSS.
El renderizador (render.cjs, Playwright + Chromium) pausa todas las
animaciones, las coloca en el instante de cada fotograma, captura la imagen y
la envía a ffmpeg. El resultado es determinista: mismo guion, mismo video.
"""

from __future__ import annotations

import html
import json
import random
import re
import subprocess
from pathlib import Path

from .plantillas.iconos import svg

RAIZ = Path(__file__).resolve().parent
CSS_BASE = (RAIZ / "plantillas" / "base.css").read_text(encoding="utf-8")
RENDER_JS = RAIZ / "render.cjs"

PALETAS = {
    #            fondo1     fondo2     acento     acento2    oscuro     tinta
    "oceano":   ("#06243d", "#0b5d8a", "#ffd23f", "#4fd1ff", "#04192b", "#ffffff"),
    "atardecer": ("#2b0f3a", "#c2366b", "#ffcc4d", "#ff8a5c", "#1d0828", "#ffffff"),
    "bosque":   ("#0c2a1f", "#1f7a4d", "#d9f45c", "#7fe0a8", "#06170f", "#ffffff"),
    "galaxia":  ("#0d0b2b", "#4b2bb5", "#ffd84d", "#9d8cff", "#070617", "#ffffff"),
    "neon":     ("#10061f", "#7a1fa2", "#36f1cd", "#ff4fd8", "#09030f", "#ffffff"),
    "fuego":    ("#2a0a06", "#b8340f", "#ffd23f", "#ff7b39", "#170503", "#ffffff"),
    "caramelo": ("#3a1c71", "#d76d77", "#ffe066", "#ffaf7b", "#1f0e3d", "#ffffff"),
    "noche":    ("#0b1020", "#24345c", "#5ee7ff", "#ffd166", "#05070f", "#ffffff"),
}
CAMARAS = ["zoom-in", "pan-izq", "ken-burns", "zoom-out", "pan-der", "subir", "inclinar", "empuje", "bajar"]


def _e(t: str) -> str:
    return html.escape(t, quote=True)


def _palabras_titular(texto: str, retardo: float, paso: float = 0.09) -> str:
    """Titular palabra a palabra. Lo escrito entre *asteriscos* va en color de acento."""
    out = []
    for i, w in enumerate(texto.split()):
        m = re.match(r"^([^*]*)\*([^*]+)\*?(.*)$", w) or re.match(r"^(.*?)([^*]+)\*(.*)$", w)
        if m and "*" in w:
            pre, nucleo, post = m.groups()
            cuerpo = f'{_e(pre)}<span class="acc">{_e(nucleo)}</span>{_e(post)}'
        else:
            cuerpo = _e(w)
        out.append(f'<span class="p in-word" style="--d:{retardo + i * paso:.2f}s">{cuerpo}</span>')
    return " ".join(out)


def _tam_titular(texto: str, base: int = 96) -> int:
    n = len(texto.replace("*", ""))
    if n <= 14: return int(base * 1.25)
    if n <= 28: return base
    if n <= 44: return int(base * 0.84)
    return int(base * 0.72)


def _fondo(paleta: tuple, semilla: int) -> str:
    rnd = random.Random(semilla)
    c1, c2, acc, acc2, dark, ink = paleta
    blobs = []
    for color in (acc2, c2, acc2):
        tam = rnd.randint(800, 1150)
        blobs.append(
            f'<div class="blob" style="width:{tam}px;height:{tam}px;left:{rnd.randint(-350, 600)}px;'
            f'top:{rnd.randint(-100, 1600)}px;background:radial-gradient(circle,{color} 0%,transparent 66%);--dx:{rnd.randint(-160, 160)}px;'
            f'--dy:{rnd.randint(-200, 200)}px;opacity:{rnd.uniform(.35, .55):.2f};'
            f'animation-delay:-{rnd.uniform(0, 14):.2f}s"></div>')
    parts = []
    for _ in range(26):
        tam = rnd.uniform(4, 14)
        dur = rnd.uniform(9, 20)
        parts.append(
            f'<div class="particula" style="width:{tam:.1f}px;height:{tam:.1f}px;left:{rnd.uniform(0, 1300):.0f}px;'
            f'top:{rnd.uniform(1900, 2400):.0f}px;--op:{rnd.uniform(.15, .55):.2f};'
            f'animation-duration:{dur:.1f}s;animation-delay:-{rnd.uniform(0, dur):.1f}s"></div>')
    return f'<div class="bg">{"".join(blobs)}<div class="rejilla"></div>{"".join(parts)}</div>'


# ---------------------------------------------------------------- tipos de escena

def _titulo(e: dict, dur: float) -> str:
    etiqueta = f'<div class="etiqueta in-down" style="--d:.1s">{_e(e["etiqueta"])}</div>' if e.get("etiqueta") else ""
    tam = _tam_titular(e["titular"], 104)
    return f"""{etiqueta}
<div class="halo in-pop" style="--d:.25s"><span class="anillo"></span><span class="anillo a2"></span><span class="anillo a3"></span>
  {svg(e["icono"], 380, "flota")}</div>
<div class="titular" style="font-size:{tam}px">{_palabras_titular(e["titular"], .6)}</div>"""


def _punto(e: dict, dur: float) -> str:
    num = f'<div class="numero in-pop" style="--d:.1s">{_e(str(e["numero"]))}</div>' if e.get("numero") else ""
    tam = _tam_titular(e["titular"], 92)
    return f"""{num}
<div class="tarjeta in-up" style="--d:.3s">{svg(e["icono"], 300, "flota")}</div>
<div class="titular" style="font-size:{tam}px">{_palabras_titular(e["titular"], .55)}</div>"""


def _dato(e: dict, dur: float) -> str:
    """Cifra grande con contador animado; si es un porcentaje, añade anillo de progreso."""
    m = re.match(r"^\s*([^\d\-]*)(-?[\d.,]+)\s*(.*)$", str(e["dato"]))
    valor = None
    if m:
        pre, num, suf = m.groups()
        dec = len(num.split(",")[1]) if "," in num else 0
        valor = float(num.replace(".", "").replace(",", "."))
    es_porcentaje = valor is not None and "%" in suf and 0 < valor <= 100
    tam = 150 if es_porcentaje else 230
    if valor is not None:
        cifra = (f'<div class="cifra in-pop" style="--d:.15s;font-size:{tam}px"><span>{_e(pre)}</span>'
                 f'<span class="contador" data-hasta="{valor}" data-dec="{dec}" data-ini="0.3" data-dur="1.6">0</span>'
                 f'<span>{_e(suf)}</span></div>')
    else:
        cifra = f'<div class="cifra in-pop" style="--d:.15s;font-size:{_tam_titular(str(e["dato"]), 160)}px">{_e(str(e["dato"]))}</div>'
    if es_porcentaje:
        r = 230
        circ = 2 * 3.14159265 * r
        anillo = (f'<svg class="progreso" width="560" height="560" viewBox="0 0 560 560" '
                  f'style="position:absolute;--circ:{circ:.1f};--fin:{circ * (1 - valor / 100):.1f}">'
                  f'<circle cx="280" cy="280" r="{r}" fill="none" stroke="var(--ink)" stroke-opacity=".15" stroke-width="30"/>'
                  f'<circle class="barra" cx="280" cy="280" r="{r}" fill="none" stroke="var(--acc)" stroke-width="30" '
                  f'stroke-linecap="round" transform="rotate(-90 280 280)"/></svg>')
        visual = f'<div class="halo in-fade" style="width:560px;height:560px">{anillo}{cifra}</div>'
    else:
        icono = f'<div class="in-pop" style="--d:.9s">{svg(e["icono"], 170, "flota")}</div>' if e.get("icono") else ""
        visual = icono + cifra
    return f"""{visual}
<div class="titular" style="font-size:{_tam_titular(e["titular"], 84)}px">{_palabras_titular(e["titular"], .9)}</div>"""


def _lista(e: dict, dur: float) -> str:
    items = e.get("items") or []
    n = max(1, len(items))
    # reparte la aparición de los elementos a lo largo de la escena
    paso = max(0.5, min(1.6, (dur - 2.0) / n))
    filas = "".join(
        f'<div class="item in-left" style="--d:{0.9 + i * paso:.2f}s">{svg(e.get("icono_items", "check"), 96)}'
        f'<span>{_e(t)}</span></div>' for i, t in enumerate(items))
    tam = _tam_titular(e["titular"], 84)
    return f"""<div class="titular" style="font-size:{tam}px">{_palabras_titular(e["titular"], .2)}</div>
<div class="lista">{filas}</div>"""


def _pregunta(e: dict, dur: float) -> str:
    tam = _tam_titular(e["titular"], 92)
    return f"""<div class="signo in-pop flota" style="--d:.1s">?</div>
<div class="titular" style="font-size:{tam}px">{_palabras_titular(e["titular"], .5)}</div>"""


def _cierre(e: dict, dur: float) -> str:
    tam = _tam_titular(e["titular"], 92)
    cta = e.get("cta", "Sígueme para más")
    return f"""<div class="halo in-pop" style="--d:.1s"><span class="anillo"></span><span class="anillo a2"></span>
  {svg(e.get("icono", "corazon"), 300, "flota")}</div>
<div class="titular" style="font-size:{tam}px">{_palabras_titular(e["titular"], .45)}</div>
<div class="cta in-up" style="--d:1.2s">{svg("corazon", 64)}<span>{_e(cta)}</span></div>"""


TIPOS = {"titulo": _titulo, "punto": _punto, "dato": _dato, "lista": _lista, "pregunta": _pregunta, "cierre": _cierre}

JS_SEEK = r"""
<script>
const hooks = [];
const T0 = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--t0')) || 0;
document.querySelectorAll('.contador').forEach(el => {
  const hasta = parseFloat(el.dataset.hasta), dec = parseInt(el.dataset.dec || 0),
        ini = parseFloat(el.dataset.ini || 0) + T0, d = parseFloat(el.dataset.dur || 1.5);
  const fmt = new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: hasta >= 10000 });
  hooks.push(t => { const k = Math.min(1, Math.max(0, (t - ini) / d)); const e = 1 - Math.pow(1 - k, 3);
                    el.textContent = fmt.format(hasta * e); });
});
window.__seek = ms => {
  document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; });
  hooks.forEach(h => h(ms / 1000));
};
window.__listo = document.fonts.ready.then(() => true);
</script>"""


def construir_html(escena: dict, duracion: float, paleta: tuple, indice: int, retardo: float = 0.0) -> str:
    """`retardo`: segundos que se retrasan las entradas (p. ej. mientras dura la transición)."""
    c1, c2, acc, acc2, dark, ink = paleta
    tipo = escena.get("tipo", "punto")
    if tipo not in TIPOS:
        raise ValueError(f"Tipo de escena desconocido: {tipo!r}. Usa uno de: {', '.join(TIPOS)}")
    camara = escena.get("camara") or CAMARAS[indice % len(CAMARAS)]
    contenido = TIPOS[tipo](escena, duracion)
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>:root{{--c1:{c1};--c2:{c2};--acc:{acc};--acc2:{acc2};--dark:{dark};--ink:{ink};--dur:{duracion:.3f}s;--cam-anim:{camara};--t0:{retardo:.3f}s;}}
{CSS_BASE}</style></head><body>
<div class="cam">{_fondo(paleta, indice * 7919 + 13)}
<div class="contenido">{contenido}</div></div>
<div class="vineta"></div>
{JS_SEEK}</body></html>"""


def renderizar(trabajos: list[dict], fps: int = 30, concurrencia: int = 3) -> None:
    """trabajos: [{"html": ruta, "salida": ruta.mp4, "duracion": s}] o, para
    capturas fijas, [{"html": ruta, "capturas": [[t, ruta.png], ...]}]."""
    spec = {"fps": fps, "ancho": 1080, "alto": 1920, "concurrencia": concurrencia,
            "trabajos": [{k: str(Path(v).resolve()) if k in ("html", "salida") else
                          [[c[0], str(Path(c[1]).resolve())] for c in v] if k == "capturas" else v
                          for k, v in t.items()} for t in trabajos]}
    spec_path = Path(trabajos[0]["html"]).parent / "render_spec.json"
    spec_path.write_text(json.dumps(spec, ensure_ascii=False, default=str))
    r = subprocess.run(["node", str(RENDER_JS), str(spec_path)])
    if r.returncode != 0:
        raise RuntimeError("Falló el renderizado de escenas (render.cjs). Revisa los mensajes anteriores.")
