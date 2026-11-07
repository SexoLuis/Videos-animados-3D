"""Utilidades de audio: lectura/escritura WAV y recorte de silencios (numpy + ffmpeg)."""

from __future__ import annotations

import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48000  # frecuencia de muestreo de trabajo


def leer_wav(ruta: Path, canales: int = 1) -> np.ndarray:
    """Lee cualquier archivo de audio (vía ffmpeg) como float32 a SR Hz."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ruta), "-f", "s16le", "-ac", str(canales),
                        "-ar", str(SR), "-"], capture_output=True, check=True)
    datos = np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    return datos.reshape(-1, canales) if canales > 1 else datos


def escribir_wav(ruta: Path, muestras: np.ndarray) -> None:
    m = np.clip(muestras, -1.0, 1.0)
    canales = 1 if m.ndim == 1 else m.shape[1]
    with wave.open(str(ruta), "wb") as w:
        w.setnchannels(canales)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((m * 32767).astype("<i2").tobytes())


def recortar_silencios(m: np.ndarray, umbral: float = 0.01, margen: float = 0.02) -> np.ndarray:
    idx = np.nonzero(np.abs(m) > umbral)[0]
    if len(idx) == 0:
        return m[:0]
    pad = int(margen * SR)
    return m[max(0, idx[0] - pad): idx[-1] + pad]


def duracion(ruta: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                        str(ruta)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())
