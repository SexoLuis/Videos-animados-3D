"""Montaje final con FFmpeg: transiciones (xfade), subtítulos (libass) y audio.

Audio: la narración se usa como señal de control (sidechain) de un compresor
sobre la música, que así baja de volumen cada vez que habla el narrador
(ducking). Después se mezcla todo y se normaliza a -14 LUFS (redes sociales).
"""

from __future__ import annotations

import subprocess
from pathlib import Path


def montar(clips: list[Path], inicios: list[float], transiciones: list[str], duracion_trans: float,
           narracion: Path, subtitulos: Path | None, salida: Path, duracion_total: float,
           musica: Path | None = None, volumen_musica: float = 0.30, fps: int = 30) -> None:
    """clips[i] empieza en inicios[i] de la línea de tiempo final; la transición
    hacia el clip i (i>=1) es transiciones[i] y dura `duracion_trans` segundos."""
    args = ["ffmpeg", "-v", "error", "-stats", "-y"]
    for c in clips:
        args += ["-i", str(Path(c).resolve())]
    i_narr = len(clips)
    args += ["-i", str(Path(narracion).resolve())]
    if musica:
        args += ["-i", str(Path(musica).resolve())]

    f = []
    for i in range(len(clips)):
        f.append(f"[{i}:v]settb=AVTB,fps={fps},format=yuv420p[c{i}]")
    previo = "c0"
    for i in range(1, len(clips)):
        f.append(f"[{previo}][c{i}]xfade=transition={transiciones[i]}:duration={duracion_trans:.3f}:"
                 f"offset={inicios[i]:.3f}[x{i}]")
        previo = f"x{i}"
    if subtitulos:
        f.append(f"[{previo}]ass='{subtitulos.name}'[v]")
    else:
        f.append(f"[{previo}]null[v]")

    f.append(f"[{i_narr}:a]aformat=sample_rates=48000:channel_layouts=stereo,apad[voz]")
    if musica:
        f.append("[voz]asplit=2[voz1][voz2]")
        f.append(f"[{i_narr + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={volumen_musica}[mus]")
        f.append("[mus][voz1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350[musd]")
        f.append("[musd][voz2]amix=inputs=2:normalize=0:duration=first[mezcla]")
    else:
        f.append("[voz]anull[mezcla]")
    f.append("[mezcla]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")

    args += ["-filter_complex", ";".join(f), "-map", "[v]", "-map", "[a]",
             "-t", f"{duracion_total:.3f}", "-r", str(fps),
             "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-profile:v", "high", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(salida.resolve())]
    # Se ejecuta en la carpeta de los subtítulos para no tener que escapar rutas en el filtro ass.
    cwd = subtitulos.parent if subtitulos else None
    r = subprocess.run(args, cwd=cwd)
    if r.returncode != 0:
        raise RuntimeError("FFmpeg falló durante el montaje final.")
