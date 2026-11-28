"""Uso: python3 verificar.py video.mp4 — duración, fotogramas sospechosos (capas perdidas) y hoja de contacto final."""
import subprocess, sys, numpy as np, os
p = sys.argv[1]
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vf', 'scale=108:192,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.uint8).reshape(-1, 192, 108).astype(float)
bad = [i for i in range(1, len(a) - 1) if np.abs(a[i] - a[i - 1]).mean() > 15 and np.abs(a[i] - a[i + 1]).mean() > 15 and np.abs(a[i - 1] - a[i + 1]).mean() < 8]
n = len(a); sel = '+'.join(f'eq(n,{int(n * k / 12) + 10})' for k in range(12))
hoja = os.path.splitext(p)[0] + '_hoja.png'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-vf', f"select='{sel}',scale=240:-1,tile=6x2:padding=4", '-frames:v', '1', '-vsync', '0', hoja])
print(f'duración {dur:.2f} s · {n} fotogramas · sospechosos: {bad or "ninguno"} · hoja: {hoja}')
sys.exit(1 if bad else 0)
