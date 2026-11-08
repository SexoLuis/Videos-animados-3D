"""Montaje de clips ya generados (por ejemplo, con IA en fal.ai) en un video vertical.

Lee una "historia" JSON: una lista de escenas, cada una con su clip de video y su
narración. Para cada escena:
  · normaliza el clip a 1080x1920 y 30 fps (recorta para llenar, sin bandas negras),
    descarta su audio y congela el último fotograma si la narración es más larga que el clip;
  · sintetiza la narración con la voz local.
Después reutiliza el resto del sistema: subtítulos palabra a palabra, música con
ducking, transiciones xfade y normalización de sonoridad.

Si un clip todavía no existe, con `marcadores=True` se crea uno provisional (fondo
con el número y el nombre de la escena) para poder probar el montaje sin gastar nada.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import time
from pathlib import Path

import numpy as np

from . import audio, montaje, musica, subtitulos, tts
from .guion import slug
from .pipeline import _normalizar_voz

ANCHO, ALTO, FPS = 1080, 1920, 30
TRANSICION = 0.5   # s de solape entre clips
ENTRADA = 0.3      # s antes de que hable el narrador en cada escena
SALIDA = 0.35      # s mínimos de imagen tras la última palabra
FUENTE = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
COLORES_MARCADOR = ["0x1f6f4a", "0x2f4f8f", "0x8f4f2f", "0x6f2f8f", "0x2f7f8f"]


def _crear_marcador(destino: Path, numero: int, nombre: str, duracion: float) -> None:
    color = COLORES_MARCADOR[(numero - 1) % len(COLORES_MARCADOR)]
    fuente = f":fontfile={FUENTE}" if Path(FUENTE).exists() else ""
    texto = (f"drawtext=text='ESCENA {numero}'{fuente}:fontsize=110:fontcolor=white:x=(w-tw)/2:y=h*0.30,"
             f"drawtext=text='{nombre}'{fuente}:fontsize=54:fontcolor=white@0.85:x=(w-tw)/2:y=h*0.30+150,"
             f"drawtext=text='clip provisional (pendiente de generar)'{fuente}:fontsize=38:fontcolor=white@0.6:"
             f"x=(w-tw)/2:y=h*0.30+240,"
             f"drawtext=text='%{{eif\\:t\\:d}} s'{fuente}:fontsize=44:fontcolor=white@0.6:x=(w-tw)/2:y=h*0.82")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
                    "-i", f"color=c={color}:s={ANCHO}x{ALTO}:r={FPS}:d={duracion:.3f}",
                    "-vf", f"vignette=PI/4,{texto}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                    "-pix_fmt", "yuv420p", str(destino)], check=True)


def _normalizar_clip(origen: Path, destino: Path, duracion: float) -> None:
    """Escala y recorta a 1080x1920, 30 fps, sin audio; congela el final si hace falta."""
    vf = (f"scale={ANCHO}:{ALTO}:force_original_aspect_ratio=increase:flags=lanczos,"
          f"crop={ANCHO}:{ALTO},setsar=1,fps={FPS},tpad=stop_mode=clone:stop_duration=30")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(origen), "-vf", vf, "-an",
                    "-t", f"{duracion:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
                    "-pix_fmt", "yuv420p", str(destino)], check=True)


def cargar(ruta: Path) -> dict:
    h = json.loads(Path(ruta).read_text(encoding="utf-8"))
    if not h.get("escenas"):
        raise ValueError("La historia no tiene escenas.")
    for i, e in enumerate(h["escenas"]):
        if not e.get("narracion"):
            raise ValueError(f"La escena {i + 1} no tiene 'narracion'.")
        e.setdefault("id", f"{i + 1:02d}")
        e.setdefault("clip", f"clips/{e['id']}.mp4")
        e.setdefault("transicion", "fade")
    h.setdefault("voz", "mb-es2")
    h.setdefault("velocidad", 160)
    h.setdefault("tono", 50)
    h.setdefault("musica", "auto")
    h.setdefault("volumen_musica", 0.25)
    h.setdefault("acento", "#FFD23F")
    h.setdefault("mayusculas", False)
    h.setdefault("duracion_clip", 10)
    return h


def montar(ruta_historia: Path, salida: Path | None = None, marcadores: bool = False,
           sin_musica: bool = False, conservar: bool = False) -> Path:
    t0 = time.time()
    ruta_historia = Path(ruta_historia).resolve()
    base = ruta_historia.parent
    h = cargar(ruta_historia)
    esc = h["escenas"]
    salida = Path(salida).resolve() if salida else base / "salida" / f"{slug(h['titulo'])}.mp4"
    salida.parent.mkdir(parents=True, exist_ok=True)
    trabajo = salida.parent / f"{salida.stem}_trabajo"
    if trabajo.exists():
        shutil.rmtree(trabajo)
    trabajo.mkdir(parents=True)

    # 1. Clips de origen ------------------------------------------------------------
    print(f"[1/5] Clips ({len(esc)} escenas)", flush=True)
    origenes, faltan = [], []
    for i, e in enumerate(esc):
        p = (base / e["clip"]).resolve()
        if not p.exists():
            if not marcadores:
                faltan.append(str(p.relative_to(base)) if p.is_relative_to(base) else str(p))
                continue
            p = trabajo / f"marcador_{i + 1:02d}.mp4"
            _crear_marcador(p, i + 1, e["id"], float(h["duracion_clip"]))
            print(f"  escena {i + 1}: marcador provisional ({h['duracion_clip']} s)")
        else:
            print(f"  escena {i + 1}: {e['clip']} ({audio.duracion(p):.1f} s)")
        origenes.append(p)
    if faltan:
        raise FileNotFoundError("Faltan clips: " + ", ".join(faltan) +
                                ". Genéralos o usa --marcadores para probar con clips provisionales.")

    # 2. Narración y línea de tiempo ----------------------------------------------------
    print(f"[2/5] Narración ({h['voz']})", flush=True)
    narraciones, duraciones, inicios, inicio_voz = [], [], [], []
    t = 0.0
    for i, (e, p) in enumerate(zip(esc, origenes)):
        n = tts.sintetizar(e["narracion"], h["voz"], h["velocidad"], h["tono"])
        n.muestras = _normalizar_voz(n.muestras)
        narraciones.append(n)
        t_in = TRANSICION if i > 0 else 0.0
        t_out = TRANSICION if i < len(esc) - 1 else 0.8
        necesaria = t_in + ENTRADA + n.duracion + SALIDA + t_out
        d = max(audio.duracion(p), necesaria)
        d = round(d * FPS) / FPS
        aviso = "  ← la voz es más larga que el clip: se congela el final" if necesaria > audio.duracion(p) + 0.05 else ""
        print(f"  escena {i + 1}: voz {n.duracion:4.1f} s, escena {d:4.1f} s{aviso}")
        inicios.append(t)
        inicio_voz.append(t + t_in + ENTRADA)
        duraciones.append(d)
        t += d - TRANSICION
    total = inicios[-1] + duraciones[-1]
    print(f"  duración total: {total:.1f} s")

    pista = np.zeros(int((total + 0.5) * audio.SR), dtype=np.float32)
    palabras_t: list[subtitulos.PalabraT] = []
    for n, tv in zip(narraciones, inicio_voz):
        i0 = int(tv * audio.SR)
        pista[i0:i0 + len(n.muestras)] += n.muestras[: len(pista) - i0]
        palabras_t += [subtitulos.PalabraT(p.texto, tv + p.inicio, tv + p.fin) for p in n.palabras]
    audio.escribir_wav(trabajo / "narracion.wav", pista)

    # 3. Normalización de clips -----------------------------------------------------------
    print("[3/5] Normalizando clips a 1080x1920, 30 fps", flush=True)
    normalizados = []
    for i, (p, d) in enumerate(zip(origenes, duraciones)):
        destino = trabajo / f"clip_{i + 1:02d}.mp4"
        _normalizar_clip(p, destino, d)
        normalizados.append(destino)

    # 4. Subtítulos y música ---------------------------------------------------------------
    print(f"[4/5] Subtítulos ({len(palabras_t)} palabras) y música", flush=True)
    ass = trabajo / "subtitulos.ass"
    subtitulos.generar_ass(palabras_t, ass, acento=h["acento"], margen_inferior=640,
                           mayusculas=bool(h["mayusculas"]))
    subtitulos.generar_srt(palabras_t, salida.with_suffix(".srt"))
    pista_musica = None
    fuente = None if sin_musica else h.get("musica")
    if fuente == "auto":
        pista_musica = trabajo / "musica.wav"
        audio.escribir_wav(pista_musica, musica.generar(total + 0.5, semilla=h["titulo"]))
    elif fuente:
        pista_musica = (base / fuente).resolve()
        if not pista_musica.exists():
            raise FileNotFoundError(f"No existe el archivo de música: {pista_musica}")

    # 5. Montaje -------------------------------------------------------------------------------
    print("[5/5] Montaje final (transiciones + subtítulos + audio)", flush=True)
    montaje.montar(normalizados, inicios, [e["transicion"] for e in esc], TRANSICION,
                   trabajo / "narracion.wav", ass, salida, total, pista_musica,
                   float(h["volumen_musica"]), FPS)

    resumen = {"titulo": h["titulo"], "duracion": round(total, 2), "marcadores": marcadores,
               "escenas": [{"id": e["id"], "clip": e["clip"], "inicio": round(inicios[i], 2),
                            "duracion": round(duraciones[i], 2)} for i, e in enumerate(esc)]}
    salida.with_suffix(".json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
    if not conservar:
        shutil.rmtree(trabajo)
    print(f"\nListo en {time.time() - t0:.0f} s → {salida} ({audio.duracion(salida):.1f} s)")
    return salida
