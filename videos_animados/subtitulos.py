"""Subtítulos ASS sincronizados palabra por palabra (estilo Reels/TikTok).

Las palabras se agrupan en bloques cortos (máx. 3 palabras / ~18 caracteres,
cortando en signos de puntuación). Mientras se muestra un bloque, la palabra
que se está pronunciando se resalta con el color de acento y algo más grande.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

MAX_PALABRAS = 3
MAX_CARACTERES = 18


@dataclass
class PalabraT:
    texto: str
    inicio: float  # segundos en la línea de tiempo final
    fin: float


def _ts(s: float) -> str:
    s = max(0.0, s)
    cs = int(round(s * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    seg, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{seg:02d}.{cs:02d}"


def _escapar(t: str) -> str:
    return t.replace("\\", "\\\\").replace("{", "(").replace("}", ")")


def _color_ass(hex_rgb: str) -> str:
    h = hex_rgb.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H00{b}{g}{r}&".upper()


def agrupar(palabras: list[PalabraT]) -> list[list[PalabraT]]:
    grupos, actual = [], []
    for p in palabras:
        largo = sum(len(x.texto) + 1 for x in actual) + len(p.texto)
        hueco = actual and p.inicio - actual[-1].fin > 0.3
        if actual and (len(actual) >= MAX_PALABRAS or largo > MAX_CARACTERES or hueco):
            grupos.append(actual); actual = []
        actual.append(p)
        if p.texto[-1] in ".,;:?!…":
            grupos.append(actual); actual = []
    if actual:
        grupos.append(actual)
    return grupos


def generar_ass(palabras: list[PalabraT], ruta: Path, acento: str = "#FFD23F",
                ancho: int = 1080, alto: int = 1920, margen_inferior: int = 560,
                mayusculas: bool = True, fuente: str = "Inter") -> None:
    col_acento = _color_ass(acento)
    cab = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {ancho}
PlayResY: {alto}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,{fuente},84,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,-1,0,0,0,100,100,1,0,1,7,4,2,80,80,{margen_inferior},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    eventos = []
    grupos = agrupar(palabras)
    for gi, grupo in enumerate(grupos):
        textos = [_escapar(p.texto.upper() if mayusculas else p.texto) for p in grupo]
        fin_grupo = grupo[-1].fin + 0.12
        if gi + 1 < len(grupos):
            fin_grupo = min(fin_grupo, grupos[gi + 1][0].inicio)
        for i, p in enumerate(grupo):
            ini = p.inicio
            fin = grupo[i + 1].inicio if i + 1 < len(grupo) else fin_grupo
            partes = []
            for j, t in enumerate(textos):
                if j == i:
                    partes.append(f"{{\\c{col_acento}\\fscx112\\fscy112}}{t}{{\\c&H00FFFFFF&\\fscx100\\fscy100}}")
                else:
                    partes.append(t)
            # pequeña animación de entrada al aparecer el bloque
            entrada = "{\\fscx85\\fscy85\\t(0,90,\\fscx100\\fscy100)}" if i == 0 else ""
            eventos.append(f"Dialogue: 0,{_ts(ini)},{_ts(fin)},Sub,,0,0,0,,{entrada}{' '.join(partes)}")
    ruta.write_text(cab + "\n".join(eventos) + "\n", encoding="utf-8")


def generar_srt(palabras: list[PalabraT], ruta: Path) -> None:
    """Subtítulos .srt por frases (para subirlos aparte a YouTube/TikTok si se desea)."""
    def ts(s: float) -> str:
        ms = int(round(max(0.0, s) * 1000))
        h, ms = divmod(ms, 3600000)
        m, ms = divmod(ms, 60000)
        s_, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{s_:02d},{ms:03d}"
    bloques, actual = [], []
    for p in palabras:
        actual.append(p)
        if p.texto[-1] in ".?!…" or len(actual) >= 8:
            bloques.append(actual); actual = []
    if actual:
        bloques.append(actual)
    lineas = []
    for i, b in enumerate(bloques, 1):
        lineas += [str(i), f"{ts(b[0].inicio)} --> {ts(b[-1].fin + 0.1)}", " ".join(p.texto for p in b), ""]
    ruta.write_text("\n".join(lineas), encoding="utf-8")
