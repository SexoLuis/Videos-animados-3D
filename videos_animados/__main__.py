"""Línea de comandos.

  python3 -m videos_animados generar --guion ejemplos/oceano.json
  python3 -m videos_animados generar --tema "El océano" --texto "El océano cubre..."
  python3 -m videos_animados generar --tema "El océano" --texto-archivo narracion.txt
  python3 -m videos_animados nuevo --tema "Los volcanes"        # crea guiones/los-volcanes.json para editar
  python3 -m videos_animados clips --historia proyectos/x/historia.json [--marcadores]  # une clips de IA
  python3 -m videos_animados verificar                          # comprueba dependencias
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from . import guion as G


def cmd_verificar(_args) -> int:
    from . import tts
    ok = True

    def linea(nombre, bien, detalle=""):
        nonlocal ok
        ok &= bien
        info = detalle if (detalle and (not bien or not detalle.startswith(("sudo", "pip", "npm")))) else ""
        print(f"  [{'OK' if bien else 'FALTA'}] {nombre}{(' — ' + info) if info else ''}")

    print("Comprobando dependencias:")
    linea("ffmpeg", bool(shutil.which("ffmpeg")))
    if shutil.which("ffmpeg"):
        filtros = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
        for f in ("ass", "xfade", "sidechaincompress", "loudnorm"):
            linea(f"  filtro {f}", f" {f} " in filtros)
    linea("espeak-ng", bool(shutil.which("espeak-ng")), "sudo apt install espeak-ng")
    voces = tts.voces_disponibles()
    linea("voces MBROLA en español", any(v.startswith("mb-") for v in voces),
          ", ".join(voces) if voces else "sudo apt install mbrola mbrola-es2")
    node = shutil.which("node")
    linea("node", bool(node))
    if node:
        r = subprocess.run(["node", "-e", "require('playwright');console.log(require('playwright/package.json').version)"],
                           capture_output=True, text=True, cwd=Path(__file__).resolve().parent.parent)
        linea("playwright (Node)", r.returncode == 0, r.stdout.strip() or "npm install && npx playwright install chromium")
    try:
        import numpy  # noqa: F401
        linea("numpy", True)
    except ImportError:
        linea("numpy", False, "pip install numpy")
    print("Todo listo." if ok else "Faltan dependencias: ejecuta scripts/instalar_dependencias.sh")
    return 0 if ok else 1


def cmd_nuevo(args) -> int:
    destino = Path(args.salida or f"guiones/{G.slug(args.tema)}.json")
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and not args.forzar:
        print(f"Ya existe {destino} (usa --forzar para sobrescribir)")
        return 1
    destino.write_text(json.dumps(G.plantilla(args.tema), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Guion creado: {destino}\nEdita las narraciones y genera el video con:\n"
          f"  python3 -m videos_animados generar --guion {destino}")
    return 0


def cmd_generar(args) -> int:
    from . import pipeline
    if args.guion:
        g = G.cargar(Path(args.guion))
    elif args.tema and (args.texto or args.texto_archivo):
        texto = args.texto or Path(args.texto_archivo).read_text(encoding="utf-8")
        g = G.desde_texto(args.tema, texto)
    elif args.tema:
        print("Para generar a partir de un tema hace falta el texto de la narración.\n"
              "  · Pásalo con --texto \"...\" o --texto-archivo narracion.txt\n"
              "  · O crea un guion editable con: python3 -m videos_animados nuevo --tema \"" + args.tema + "\"\n"
              "(Escribir el guion automáticamente solo a partir del tema requiere un modelo de lenguaje,\n"
              " que no está incluido en esta versión gratuita y local.)")
        return 2
    else:
        print("Indica --guion archivo.json, o --tema junto con --texto / --texto-archivo.")
        return 2
    for clave in ("voz", "velocidad", "paleta"):
        if getattr(args, clave):
            g[clave] = getattr(args, clave)
    G.completar(g)
    if args.mostrar_guion:
        print(json.dumps(g, ensure_ascii=False, indent=2))
    pipeline.generar(g, Path(args.salida) if args.salida else None, musica_archivo=args.musica,
                     sin_musica=args.sin_musica, volumen_musica=args.volumen_musica, conservar=args.conservar,
                     vista_previa=args.vista_previa, concurrencia=args.paralelo)
    return 0


def cmd_clips(args) -> int:
    from . import clips
    clips.montar(Path(args.historia), Path(args.salida) if args.salida else None,
                 marcadores=args.marcadores, sin_musica=args.sin_musica, conservar=args.conservar)
    return 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="videos_animados", description="Genera videos animados verticales (1080x1920) "
                                "con narración, subtítulos y música.")
    sub = p.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("generar", help="genera un video")
    g.add_argument("--guion", help="archivo JSON con el guion")
    g.add_argument("--tema", help="tema / título del video")
    g.add_argument("--texto", help="texto de la narración (se divide en escenas automáticamente)")
    g.add_argument("--texto-archivo", help="archivo .txt con la narración")
    g.add_argument("-o", "--salida", help="ruta del MP4 de salida (por defecto salida/<titulo>.mp4)")
    g.add_argument("--voz", help="voz TTS: mb-es2 (defecto), mb-es1, mb-es3, mb-es4, es…")
    g.add_argument("--velocidad", type=int, help="palabras por minuto reales de la voz (defecto 155)")
    g.add_argument("--paleta", help="paleta de colores: " + ", ".join(__import__("videos_animados.escenas", fromlist=["x"]).PALETAS))
    g.add_argument("--musica", help="archivo de música propio (mp3/wav/ogg…)")
    g.add_argument("--sin-musica", action="store_true", help="sin música de fondo")
    g.add_argument("--volumen-musica", type=float, default=0.30, help="volumen de la música (defecto 0.30)")
    g.add_argument("--vista-previa", action="store_true", help="solo genera una imagen por escena (rápido)")
    g.add_argument("--conservar", action="store_true", help="conserva los archivos intermedios")
    g.add_argument("--paralelo", type=int, help="escenas renderizadas en paralelo (defecto: núcleos, máx. 4)")
    g.add_argument("--mostrar-guion", action="store_true", help="imprime el guion completo antes de generar")
    g.set_defaults(func=cmd_generar)

    n = sub.add_parser("nuevo", help="crea un guion JSON de ejemplo para un tema")
    n.add_argument("--tema", required=True)
    n.add_argument("-o", "--salida")
    n.add_argument("--forzar", action="store_true")
    n.set_defaults(func=cmd_nuevo)

    c = sub.add_parser("clips", help="une clips ya generados (p. ej. con IA) con narración, subtítulos y música")
    c.add_argument("--historia", required=True, help="archivo JSON con las escenas, sus clips y narraciones")
    c.add_argument("-o", "--salida", help="ruta del MP4 (por defecto <carpeta de la historia>/salida/<titulo>.mp4)")
    c.add_argument("--marcadores", action="store_true", help="usa clips provisionales para las escenas que falten")
    c.add_argument("--sin-musica", action="store_true", help="sin música de fondo")
    c.add_argument("--conservar", action="store_true", help="conserva los archivos intermedios")
    c.set_defaults(func=cmd_clips)

    v = sub.add_parser("verificar", help="comprueba que están instaladas las dependencias")
    v.set_defaults(func=cmd_verificar)

    args = p.parse_args(argv)
    try:
        return args.func(args)
    except (ValueError, FileNotFoundError, RuntimeError) as e:
        print(f"\nError: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
