"""Narración en español con TTS gratuito y local.

Motor: espeak-ng (fonemas y prosodia) + voces MBROLA (síntesis por difonos).
Si MBROLA no está instalado se usa la voz nativa de espeak-ng.

La tabla de fonemas de espeak-ng para las voces MBROLA españolas emite algunos
símbolos que la base de difonos no conoce (p. ej. `h` en lugar de `r` en "br",
`R2` en lugar de `R`). Esos huecos se convierten en silencios audibles, así que
aquí se corrige el archivo .pho antes de pasarlo a `mbrola`.
"""

from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from . import audio

MBROLA_DIR = Path("/usr/share/mbrola")

# Sustituciones fijas (errores conocidos de la tabla espeak→mbrola en español).
MAPEO_FIJO = {"h": "r", "R2": "R"}
# Sustituciones de respaldo cuando un difono concreto no existe en la voz.
RESPALDO = {"L": "j", "j": "i", "tS": "t", "x": "H", "J": "n",
            "T": "s", "B": "b", "D": "d", "G": "g", "w": "u", "e/": "e",
            "o/": "o", "a/": "a", "i/": "i", "u/": "u",
            "J^": "n", "oI": "o", "l^": "l", "jj": "j"}

# espeak-ng -s no equivale a palabras/minuto reales con MBROLA; factores medidos
# (ppm reales / valor -s) con texto en español, incluyendo pausas entre frases.
FACTOR_VELOCIDAD = {"mb-es1": 1.18, "mb-es2": 1.27, "mb-es3": 1.155, "mb-es4": 1.155,
                    "mb-mx1": 1.17, "mb-mx2": 1.17, "mb-vz1": 1.17, "es": 1.04}

_PAUSAS = {",": 0.16, ";": 0.22, ":": 0.22, ".": 0.38, "?": 0.38, "!": 0.38, "…": 0.4}


@dataclass
class Palabra:
    texto: str
    inicio: float  # segundos, relativos al inicio del audio devuelto
    fin: float


@dataclass
class Narracion:
    muestras: np.ndarray  # float32 mono a audio.SR
    palabras: list[Palabra]

    @property
    def duracion(self) -> float:
        return len(self.muestras) / audio.SR


def voces_disponibles() -> list[str]:
    voces = []
    if shutil.which("espeak-ng"):
        voces.append("es")
        if shutil.which("mbrola"):
            for v in ("es1", "es2", "es3", "es4", "mx1", "mx2", "vz1"):
                if (MBROLA_DIR / v / v).exists():
                    voces.append(f"mb-{v}")
    return voces


def _corregir_pho(pho: str, base: Path) -> str:
    lineas = [l.split("\t") for l in pho.splitlines() if l.strip() and not l.startswith(";")]
    for i, l in enumerate(lineas):
        if l[0] in MAPEO_FIJO:
            l[0] = MAPEO_FIJO[l[0]]
        # "agua" → a H b a: la tabla escribe la semivocal /w/ como "b" tras "H".
        if l[0] == "b" and i > 0 and lineas[i - 1][0] == "H":
            l[0] = "u"
    # Hasta 3 pasadas: preguntar a mbrola qué difonos faltan y sustituir.
    for _ in range(3):
        texto = "\n".join("\t".join(l) for l in lineas) + "\n"
        r = subprocess.run(["mbrola", "-e", str(base), "-", "/dev/null"], input=texto,
                           capture_output=True, text=True)
        faltan = set(re.findall(r"Warning: (\S+)-(\S+) unknown", r.stderr))
        if not faltan:
            break
        cambios = 0
        for i in range(len(lineas) - 1):
            a, b = lineas[i][0], lineas[i + 1][0]
            if (a, b) in faltan:
                if b in RESPALDO:
                    lineas[i + 1][0] = RESPALDO[b]; cambios += 1
                elif a in RESPALDO:
                    lineas[i][0] = RESPALDO[a]; cambios += 1
        if not cambios:
            break  # lo que quede, mbrola lo sustituye por un silencio breve
    return "\n".join("\t".join(l) for l in lineas) + "\n"


def _sintetizar_frase(texto: str, voz: str, velocidad: int, tono: int, tmp: Path) -> np.ndarray:
    wav = tmp / "frase.wav"
    if voz.startswith("mb-"):
        base = MBROLA_DIR / voz[3:] / voz[3:]
        pho = subprocess.run(["espeak-ng", "-v", voz, "-s", str(velocidad), "-p", str(tono),
                              "-q", "--pho", texto], capture_output=True, text=True, check=True).stdout
        (tmp / "f.pho").write_text(_corregir_pho(pho, base))
        subprocess.run(["mbrola", "-e", str(base), str(tmp / "f.pho"), str(wav)],
                       capture_output=True, check=True)
    else:
        subprocess.run(["espeak-ng", "-v", voz, "-s", str(velocidad), "-p", str(tono),
                        "-w", str(wav), texto], capture_output=True, check=True)
    return audio.recortar_silencios(audio.leer_wav(wav))


def _frases(texto: str) -> list[tuple[str, float]]:
    """Divide en frases por signos de puntuación; devuelve (frase, pausa_posterior)."""
    texto = re.sub(r"\s+", " ", texto.strip())
    trozos = re.findall(r"[^,;:.?!…]+[,;:.?!…]*", texto)
    res = []
    for t in trozos:
        t = t.strip()
        if not re.search(r"\w", t):
            continue
        signo = t[-1] if t[-1] in _PAUSAS else ""
        res.append((t, _PAUSAS.get(signo, 0.12)))
    return res


def _peso(palabra: str) -> float:
    letras = re.sub(r"[^\wáéíóúüñ]", "", palabra.lower())
    vocales = len(re.findall(r"[aeiouáéíóúü]", letras))
    return max(1.0, len(letras) * 0.7 + vocales * 0.6) + 0.5


def sintetizar(texto: str, voz: str = "mb-es2", velocidad: int = 155, tono: int = 50) -> Narracion:
    """Sintetiza `texto` y devuelve el audio con tiempos aproximados por palabra.

    `velocidad` son palabras por minuto reales (≈150-165 es un ritmo natural de Reels).

    Cada frase se sintetiza por separado, así sus límites son exactos; dentro de
    una frase el tiempo de cada palabra se reparte según su longitud.
    """
    if voz not in voces_disponibles():
        alternativa = "es" if "es" in voces_disponibles() else None
        if alternativa is None:
            raise RuntimeError("No hay ningún TTS disponible. Instala espeak-ng (scripts/instalar_dependencias.sh).")
        print(f"  [tts] voz '{voz}' no disponible, uso '{alternativa}'")
        voz = alternativa
    velocidad = max(60, round(velocidad / FACTOR_VELOCIDAD.get(voz, 1.1)))
    bloques, palabras, t = [], [], 0.0
    with tempfile.TemporaryDirectory() as d:
        for frase, pausa in _frases(texto):
            m = _sintetizar_frase(frase, voz, velocidad, tono, Path(d))
            dur = len(m) / audio.SR
            ws = frase.split()
            pesos = [_peso(w) for w in ws]
            total, acc = sum(pesos), 0.0
            for w, p in zip(ws, pesos):
                ini = t + dur * acc / total
                acc += p
                palabras.append(Palabra(w, ini, t + dur * acc / total))
            bloques.append(m)
            bloques.append(np.zeros(int(pausa * audio.SR), dtype=np.float32))
            t += dur + pausa
    if bloques:
        bloques.pop()  # sin pausa al final
    return Narracion(np.concatenate(bloques) if bloques else np.zeros(1, np.float32), palabras)
