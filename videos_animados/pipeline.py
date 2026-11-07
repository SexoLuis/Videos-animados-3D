"""Orquestador: guion → narración → línea de tiempo → escenas → subtítulos → música → montaje."""

from __future__ import annotations

import json
import os
import shutil
import time
from pathlib import Path

import numpy as np

from . import audio, escenas, montaje, musica, subtitulos, tts
from .guion import slug

TRANSICION = 0.5   # s que dura cada transición (solape entre escenas)
ENTRADA = 0.35     # s de imagen antes de que empiece a hablar el narrador en cada escena
SALIDA = 0.30      # s de imagen tras terminar de hablar, antes de la transición
FINAL = 1.2        # s extra al final del video
FPS = 30


def _normalizar_voz(m: np.ndarray, rms_db: float = -19.0, pico: float = 0.95) -> np.ndarray:
    rms = np.sqrt(np.mean(m ** 2)) or 1e-9
    g = 10 ** (rms_db / 20) / rms
    g = min(g, pico / (np.abs(m).max() or 1e-9))
    return (m * g).astype(np.float32)


def _paso(n: int, total: int, texto: str) -> None:
    print(f"\n[{n}/{total}] {texto}", flush=True)


def generar(guion: dict, salida: Path | None = None, musica_archivo: str | None = None,
            sin_musica: bool = False, volumen_musica: float = 0.30, conservar: bool = False,
            vista_previa: bool = False, concurrencia: int | None = None) -> Path:
    t0 = time.time()
    nombre = slug(guion["titulo"])
    salida = Path(salida) if salida else Path("salida") / f"{nombre}.mp4"
    salida.parent.mkdir(parents=True, exist_ok=True)
    trabajo = salida.parent / f"{salida.stem}_trabajo"
    if trabajo.exists():
        shutil.rmtree(trabajo)
    trabajo.mkdir(parents=True)
    concurrencia = concurrencia or max(1, min(4, os.cpu_count() or 2))
    total_pasos = 2 if vista_previa else 6
    esc = guion["escenas"]
    paleta = escenas.PALETAS[guion["paleta"]]

    # 1. Narración por escena ---------------------------------------------------
    _paso(1, total_pasos, f"Narración ({guion['voz']}, {len(esc)} escenas)")
    narraciones = []
    for i, e in enumerate(esc):
        n = tts.sintetizar(e["narracion"], guion["voz"], guion["velocidad"], guion["tono"])
        n.muestras = _normalizar_voz(n.muestras)
        narraciones.append(n)
        print(f"  escena {i + 1}: {n.duracion:5.2f} s  «{e['narracion'][:60]}{'…' if len(e['narracion']) > 60 else ''}»")

    # 2. Línea de tiempo --------------------------------------------------------
    duraciones, inicios, inicio_voz = [], [], []
    t = 0.0
    for i, n in enumerate(narraciones):
        t_in = TRANSICION if i > 0 else 0.0
        t_out = TRANSICION if i < len(esc) - 1 else FINAL
        d = t_in + ENTRADA + n.duracion + SALIDA + t_out
        d = round(d * FPS) / FPS  # duración exacta en fotogramas
        inicios.append(t)
        inicio_voz.append(t + t_in + ENTRADA)
        duraciones.append(d)
        t += d - TRANSICION
    total = inicios[-1] + duraciones[-1]
    print(f"  duración total: {total:.1f} s")
    if not 50 <= total <= 60:
        print(f"  aviso: el objetivo para Reels/Shorts es 50-60 s (ahora {total:.1f} s). "
              "Ajusta la longitud del texto o la 'velocidad' de la voz.")

    if vista_previa:
        _paso(2, total_pasos, "Vista previa (un fotograma por escena)")
        trab = []
        for i, e in enumerate(esc):
            h = trabajo / f"escena_{i + 1:02d}.html"
            h.write_text(escenas.construir_html(e, duraciones[i], paleta, i, TRANSICION if i > 0 else 0.0), encoding="utf-8")
            trab.append({"html": h, "capturas": [[min(2.2, duraciones[i] * 0.6), trabajo / f"previa_{i + 1:02d}.png"]]})
        escenas.renderizar(trab, FPS, concurrencia)
        hoja = salida.with_name(f"{salida.stem}_previa.png")
        import subprocess
        entradas = sum([["-i", str(trabajo / f"previa_{i + 1:02d}.png")] for i in range(len(esc))], [])
        subprocess.run(["ffmpeg", "-v", "error", "-y", *entradas, "-filter_complex",
                        "".join(f"[{i}]" for i in range(len(esc))) + f"hstack={len(esc)},scale=-1:960" if len(esc) > 1
                        else "[0]scale=-1:960", str(hoja)], check=True)
        print(f"\nVista previa: {hoja}")
        return hoja

    # Pista de narración completa
    pista = np.zeros(int((total + 0.5) * audio.SR), dtype=np.float32)
    palabras_t: list[subtitulos.PalabraT] = []
    for n, tv in zip(narraciones, inicio_voz):
        i0 = int(tv * audio.SR)
        pista[i0:i0 + len(n.muestras)] += n.muestras
        palabras_t += [subtitulos.PalabraT(p.texto, tv + p.inicio, tv + p.fin) for p in n.palabras]
    audio.escribir_wav(trabajo / "narracion.wav", pista)

    # 3. Escenas animadas ---------------------------------------------------------
    _paso(3, total_pasos, f"Escenas animadas HTML/CSS/SVG → video ({sum(duraciones):.0f} s de material, "
                          f"{concurrencia} en paralelo)")
    trab = []
    for i, e in enumerate(esc):
        h = trabajo / f"escena_{i + 1:02d}.html"
        h.write_text(escenas.construir_html(e, duraciones[i], paleta, i, TRANSICION if i > 0 else 0.0), encoding="utf-8")
        trab.append({"html": h, "salida": trabajo / f"escena_{i + 1:02d}.mp4", "duracion": duraciones[i]})
    # las escenas largas primero, para repartir mejor la carga
    escenas.renderizar(sorted(trab, key=lambda x: -x["duracion"]), FPS, concurrencia)

    # 4. Subtítulos -------------------------------------------------------------------
    _paso(4, total_pasos, f"Subtítulos ({len(palabras_t)} palabras)")
    ass = trabajo / "subtitulos.ass"
    subtitulos.generar_ass(palabras_t, ass, acento=paleta[2])
    subtitulos.generar_srt(palabras_t, salida.with_suffix(".srt"))
    print(f"  {ass.name} y {salida.with_suffix('.srt').name}")

    # 5. Música -----------------------------------------------------------------------
    pista_musica = None
    fuente = musica_archivo or guion.get("musica")
    if sin_musica or not fuente:
        _paso(5, total_pasos, "Música: desactivada")
    elif fuente == "auto":
        _paso(5, total_pasos, "Música: generada por código")
        pista_musica = trabajo / "musica.wav"
        audio.escribir_wav(pista_musica, musica.generar(total + 0.5, semilla=guion["titulo"]))
    else:
        if not Path(fuente).exists():
            raise FileNotFoundError(f"No existe el archivo de música: {fuente}")
        _paso(5, total_pasos, f"Música: {fuente}")
        # se repite si es corta, y se le aplica un fundido de entrada/salida
        m = audio.leer_wav(Path(fuente), canales=2)
        reps = int(np.ceil((total + 0.5) * audio.SR / len(m)))
        m = np.tile(m, (reps, 1))[: int((total + 0.5) * audio.SR)]
        fi, fo = int(0.8 * audio.SR), int(2.0 * audio.SR)
        m[:fi] *= np.linspace(0, 1, fi)[:, None]
        m[-fo:] *= np.linspace(1, 0, fo)[:, None]
        m = m / (np.abs(m).max() or 1) * 0.8
        pista_musica = trabajo / "musica.wav"
        audio.escribir_wav(pista_musica, m)

    # 6. Montaje -----------------------------------------------------------------------
    _paso(6, total_pasos, "Montaje final con FFmpeg (transiciones + subtítulos + audio)")
    montaje.montar([t["salida"] for t in trab], inicios, [e["transicion"] for e in esc], TRANSICION,
                   trabajo / "narracion.wav", ass, salida, total, pista_musica, volumen_musica, FPS)

    resumen = {"titulo": guion["titulo"], "duracion": round(total, 2), "escenas": [
        {**e, "inicio": round(inicios[i], 2), "duracion": round(duraciones[i], 2)} for i, e in enumerate(esc)]}
    (salida.with_suffix(".json")).write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
    if not conservar:
        shutil.rmtree(trabajo)
    print(f"\nListo en {time.time() - t0:.0f} s → {salida} ({audio.duracion(salida):.1f} s, "
          f"{salida.stat().st_size / 1e6:.1f} MB)")
    return salida
