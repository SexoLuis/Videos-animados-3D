"""Une los clips de Bubu en un video vertical con gancho, transiciones y subtítulos.

  python3 proyectos/bubu/montar.py [montaje.json]

montaje.json:
  · gancho: un fragmento corto de un clip (por ejemplo, el rugido) que abre el video con
    zoom rápido y destello, más el texto del gancho (tiempos absolutos).
  · escenas: clips en orden; cada uno con sus subtítulos [inicio, fin, "texto"] en segundos
    relativos al comienzo del clip. Lo que va entre *asteriscos* se pinta en amarillo.
Se conserva el audio original de los clips (con fundido cruzado en las transiciones).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ANCHO, ALTO, FPS = 1080, 1920, 30
BASE = Path(__file__).resolve().parent


def duracion(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def tiene_audio(p: Path) -> bool:
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                        "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return bool(r.stdout.strip())


def ts(s: float) -> str:
    cs = int(round(max(0.0, s) * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    seg, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{seg:02d}.{cs:02d}"


def color_ass(hex_rgb: str) -> str:
    h = hex_rgb.lstrip("#")
    return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}&".upper()


def bloques(texto: str, max_palabras: int = 3, max_car: int = 20) -> list[list[str]]:
    """Divide la frase en bloques cortos (estilo Reels), cortando tras la puntuación."""
    res, actual = [], []
    for p in texto.split():
        largo = sum(len(x) + 1 for x in actual) + len(p.replace("*", ""))
        if actual and (len(actual) >= max_palabras or largo > max_car):
            res.append(actual); actual = []
        actual.append(p)
        if p.rstrip("*")[-1:] in ".,;:?!…":
            res.append(actual); actual = []
    if actual:
        res.append(actual)
    return res


def generar_ass(frases: list[tuple[float, float, str]], ruta: Path, acento: str) -> None:
    amarillo = color_ass(acento)
    cab = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {ANCHO}
PlayResY: {ALTO}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Inter,92,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,-1,0,0,0,100,100,1,0,1,8,4,2,70,70,700,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for ini, fin, texto in frases:
        # "*15 metros*" → "*15* *metros*": cada palabra clave lleva su marca, aunque caiga en otro bloque
        texto = re.sub(r"\*([^*]+)\*", lambda m: " ".join(f"*{w}*" for w in m.group(1).split()), texto)
        grupos = bloques(texto)
        pesos = [sum(len(w.replace("*", "")) + 2 for w in g) for g in grupos]
        t = ini
        for g, peso in zip(grupos, pesos):
            d = (fin - ini) * peso / sum(pesos)
            partes = []
            for w in g:
                limpio = w.replace("{", "(").replace("}", ")")
                if "*" in limpio:
                    # la palabra clave (o el grupo de palabras entre asteriscos) va en amarillo
                    limpio = re.sub(r"\*([^*]*)\*?", lambda m: f"{{\\c{amarillo}}}{m.group(1)}{{\\c&H00FFFFFF&}}", limpio)
                    limpio = limpio.replace("*", "")
                partes.append(limpio)
            linea = " ".join(partes)
            ev.append(f"Dialogue: 0,{ts(t)},{ts(t + d)},Sub,,0,0,0,,{{\\fscx80\\fscy80\\t(0,100,\\fscx100\\fscy100)}}{linea}")
            t += d
    ruta.write_text(cab + "\n".join(ev) + "\n", encoding="utf-8")


def main() -> None:
    cfg_ruta = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else BASE / "montaje.json"
    cfg = json.loads(cfg_ruta.read_text(encoding="utf-8"))
    base = cfg_ruta.parent
    salida = base / cfg["salida"]
    salida.parent.mkdir(parents=True, exist_ok=True)
    T = float(cfg.get("duracion_transicion", 0.5))
    norm = (f"scale={ANCHO}:{ALTO}:force_original_aspect_ratio=increase:flags=lanczos,crop={ANCHO}:{ALTO},"
            f"setsar=1,fps={FPS},format=yuv420p")

    entradas, filtros, frases = [], [], []
    g = cfg.get("gancho")
    t = 0.0
    v_prev = a_prev = None
    idx = 0
    if g:
        clip = base / g["clip"]
        Lg = g["hasta"] - g["desde"]
        entradas += ["-ss", str(g["desde"]), "-t", f"{Lg:.3f}", "-i", str(clip)]
        n = int(round(Lg * FPS))
        zoom = float(g.get("zoom", 1.2))
        f = (f"[{idx}:v]{norm},zoompan=z='1+{zoom - 1}*on/{n}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
             f"s={ANCHO}x{ALTO}:fps={FPS}")
        if g.get("destello"):
            f += ",fade=in:st=0:d=0.25:color=white"
        filtros.append(f + ",settb=AVTB[vg]")
        filtros.append(f"[{idx}:a]aformat=sample_rates=48000:channel_layouts=stereo[ag]" if tiene_audio(clip)
                       else f"anullsrc=r=48000:cl=stereo,atrim=0:{Lg:.3f}[ag]")
        v_prev, a_prev = "vg", "ag"
        t = Lg
        idx += 1
        if g.get("texto"):
            frases.append(tuple(g["texto"]))

    for i, e in enumerate(cfg["escenas"]):
        clip = base / e["clip"]
        d = duracion(clip)
        entradas += ["-i", str(clip)]
        filtros.append(f"[{idx}:v]{norm},settb=AVTB[v{i}]")
        filtros.append(f"[{idx}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{d:.3f}[a{i}]"
                       if tiene_audio(clip) else f"anullsrc=r=48000:cl=stereo,atrim=0:{d:.3f}[a{i}]")
        if v_prev is None:
            inicio = 0.0
            v_prev, a_prev = f"v{i}", f"a{i}"
        elif i == 0:
            # tras el gancho: corte seco (más impacto)
            inicio = t
            filtros.append(f"[{v_prev}][v{i}]concat=n=2:v=1:a=0[vc{i}]")
            filtros.append(f"[{a_prev}][a{i}]concat=n=2:v=0:a=1[ac{i}]")
            v_prev, a_prev = f"vc{i}", f"ac{i}"
        else:
            inicio = t - T
            trans = e.get("transicion", cfg.get("transicion", "fade"))
            filtros.append(f"[{v_prev}][v{i}]xfade=transition={trans}:duration={T}:offset={inicio:.3f}[vc{i}]")
            filtros.append(f"[{a_prev}][a{i}]acrossfade=d={T}[ac{i}]")
            v_prev, a_prev = f"vc{i}", f"ac{i}"
        t = inicio + d
        for a, b, texto in e.get("subtitulos", []):
            frases.append((inicio + a, inicio + b, texto))
        idx += 1

    ass = salida.with_suffix(".ass")
    generar_ass(frases, ass, cfg.get("acento", "#FFD23F"))
    filtros.append(f"[{v_prev}]ass='{ass.name}',vignette=PI/7[v]")
    filtros.append(f"[{a_prev}]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")
    cmd = ["ffmpeg", "-v", "error", "-y", *entradas, "-filter_complex", ";".join(filtros), "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(salida)]
    subprocess.run(cmd, check=True, cwd=ass.parent)
    print(f"Listo: {salida} ({duracion(salida):.1f} s)")


if __name__ == "__main__":
    main()
