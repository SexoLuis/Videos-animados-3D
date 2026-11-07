"""Música de fondo generada por código (numpy), libre de derechos.

Crea un loop suave tipo "lo-fi / explainer": pad de acordes, arpegio, bajo,
bombo y hi-hat. La semilla (p. ej. el tema del video) elige tonalidad,
progresión y tempo, así cada video suena distinto pero de forma reproducible.
También se puede usar un archivo propio (mp3/wav) en lugar de esto.
"""

from __future__ import annotations

import hashlib
import random

import numpy as np

from .audio import SR

PROGRESIONES = [  # grados en semitonos respecto a la tónica (acordes de 3 notas)
    [(0, 4, 7), (7, 11, 14), (9, 12, 16), (5, 9, 12)],   # I V vi IV
    [(9, 12, 16), (5, 9, 12), (0, 4, 7), (7, 11, 14)],   # vi IV I V
    [(0, 4, 7), (9, 12, 16), (5, 9, 12), (7, 11, 14)],   # I vi IV V
    [(0, 3, 7), (8, 12, 15), (3, 7, 10), (10, 14, 17)],  # i VI III VII (menor)
]


def _hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def _env(n: int, a: float, r: float) -> np.ndarray:
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4))
    return e * np.exp(-t / max(r, 1e-4))


def generar(duracion: float, semilla: str = "videos", volumen: float = 0.8) -> np.ndarray:
    """Devuelve audio estéreo float32 (n, 2) de `duracion` segundos."""
    rnd = random.Random(int(hashlib.md5(semilla.encode()).hexdigest()[:8], 16))
    tonica = 48 + rnd.choice([0, 2, 3, 5, 7, 9])  # C3..A3
    prog = rnd.choice(PROGRESIONES)
    bpm = rnd.choice([84, 90, 96, 100])
    beat = 60.0 / bpm
    compas = 4 * beat
    n = int((duracion + 1) * SR)
    mezcla = np.zeros((n, 2), dtype=np.float32)

    def poner(señal: np.ndarray, t0: float, pan: float = 0.0, g: float = 1.0):
        i = int(t0 * SR)
        if i >= n:
            return
        s = señal[: n - i] * g
        mezcla[i:i + len(s), 0] += s * (1 - pan) * 0.5 + s * 0.5 * (1 - abs(pan))
        mezcla[i:i + len(s), 1] += s * (1 + pan) * 0.5 + s * 0.5 * (1 - abs(pan))

    t_compas = 0.0
    k = 0
    while t_compas < duracion + 1:
        acorde = prog[k % len(prog)]
        nl = int(compas * SR)
        t = np.arange(nl) / SR
        # Pad: senos desafinados con ataque lento
        pad = np.zeros(nl, dtype=np.float32)
        for st in acorde:
            f = _hz(tonica + 12 + st)
            for det in (-0.12, 0.12):
                pad += np.sin(2 * np.pi * f * (1 + det / 100) * t).astype(np.float32)
        env_pad = np.minimum(1, t / 0.6) * np.minimum(1, (compas - t) / 0.4)
        poner(pad * env_pad * 0.045, t_compas)
        # Bajo: tónica del acorde en negras 1 y 3
        for b in (0, 2):
            nb = int(beat * 1.6 * SR)
            tb = np.arange(nb) / SR
            f = _hz(tonica - 12 + acorde[0])
            bajo = (np.sin(2 * np.pi * f * tb) + 0.3 * np.sin(4 * np.pi * f * tb)) * _env(nb, 0.01, 0.45)
            poner(bajo.astype(np.float32) * 0.16, t_compas + b * beat)
        # Arpegio en corcheas (pluck: seno + armónico con caída rápida)
        patron = [0, 1, 2, 1, 0, 2, 1, 2]
        for c, idx in enumerate(patron):
            if rnd.random() < 0.15:
                continue
            na = int(beat * 0.9 * SR)
            ta = np.arange(na) / SR
            f = _hz(tonica + 24 + acorde[idx])
            pl = (np.sin(2 * np.pi * f * ta) + 0.25 * np.sin(6 * np.pi * f * ta)) * _env(na, 0.004, 0.18)
            poner(pl.astype(np.float32) * 0.05, t_compas + c * beat / 2, pan=rnd.uniform(-0.5, 0.5))
        # Bombo en 1 y 3, hi-hat en corcheas a contratiempo
        for b in (0, 2):
            nk = int(0.35 * SR)
            tk = np.arange(nk) / SR
            f_k = 50 + 90 * np.exp(-tk * 30)
            kick = np.sin(2 * np.pi * np.cumsum(f_k) / SR) * np.exp(-tk * 9)
            poner(kick.astype(np.float32) * 0.22, t_compas + b * beat)
        for c in range(8):
            if c % 2 == 1:
                nh = int(0.06 * SR)
                ruido = np.random.default_rng(k * 8 + c).standard_normal(nh).astype(np.float32)
                ruido = np.diff(ruido, prepend=0)  # paso alto sencillo
                poner(ruido * _env(nh, 0.001, 0.02).astype(np.float32) * 0.025, t_compas + c * beat / 2)
        t_compas += compas
        k += 1

    mezcla = mezcla[: int(duracion * SR)]
    # Fundido de entrada/salida y normalización
    nf_in, nf_out = int(1.0 * SR), int(2.0 * SR)
    mezcla[:nf_in] *= np.linspace(0, 1, nf_in)[:, None]
    mezcla[-nf_out:] *= np.linspace(1, 0, min(nf_out, len(mezcla)))[:, None]
    pico = np.abs(mezcla).max() or 1.0
    return (mezcla / pico * volumen * 0.9).astype(np.float32)
