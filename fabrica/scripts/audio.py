"""Uso: python3 audio.py <carpeta_del_video> <segundos_totales>

Mezcla la narración (sin alterar) + música sintetizada suave con ducking + efectos sincronizados.
Los efectos se leen de <carpeta>/eventos.json:  [{"t": 3.2, "sfx": "pop", "g": 1.0, "d": 1.0}, ...]
Efectos disponibles: whoosh, pop, boing, golpe, ding, campanita, alarma, latido, castaneo, ronquido,
                     glup, burbujas, zumbido, viento, lluvia, tictac, click, estomago, bostezo_musical, risa_tuba
Ambientes de fondo opcionales en <carpeta>/ambientes.json: [{"desde": s, "hasta": s, "tipo": ...}]
  tipos: comedor, noche, lluvia, cuerpo, control, calle, cocina, gimnasio, oficina, naturaleza
Escribe <carpeta>/mezcla.wav (48 kHz).
"""
import numpy as np, subprocess, wave, json, sys, os, hashlib

D = sys.argv[1]; DUR = float(sys.argv[2])
SR = 48000; N = int(SR * DUR)
seed = int(hashlib.md5(D.encode()).hexdigest()[:8], 16)
rng = np.random.default_rng(seed)

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(D, 'narracion.mp3'), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
v = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
V = np.zeros(N); V[:min(N, len(v))] = v[:N]

def env(n, a, r):
    e = np.ones(n); A = int(a * SR); R = int(r * SR)
    if A: e[:A] = np.linspace(0, 1, A)
    if R: e[-R:] *= np.linspace(1, 0, R)
    return e
def note(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def lp(x, a):
    # paso bajo de un polo (vectorizado con lfilter casero vía cumsum no es estable; se usa un bucle con numpy por bloques)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y

# ---------- música: tonalidad, tempo y progresión según la carpeta ----------
PROGS = [[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],   # Am F C G
         [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]],   # C G Am F
         [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]],   # Dm Bb F C
         [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]]]   # Em C G D
prog = PROGS[seed % 4]; bpm = [96, 100, 104, 98][(seed // 4) % 4]
beat = 60 / bpm; bar = beat * 4
M = np.zeros(N)
for b in range(int(DUR / bar) + 1):
    ch = prog[b % 4]; s0 = int(b * bar * SR); n = min(int(bar * SR), N - s0)
    if n <= 0: break
    x = np.arange(n) / SR
    M[s0:s0 + n] += 0.045 * sum(np.sin(2 * np.pi * note(m) * x) + 0.25 * np.sin(2 * np.pi * note(m) * 2.003 * x) for m in ch) * env(n, 0.4, 0.5)
    M[s0:s0 + n] += 0.12 * np.sin(2 * np.pi * note(ch[0] - 12) * x) * np.exp(-x * 1.2)
    for k in range(8):  # pizzicato juguetón
        s1 = s0 + int(k * beat / 2 * SR); L = min(int(0.3 * SR), N - s1)
        if L <= 0 or (k % 3 == 2): continue
        y = np.arange(L) / SR
        M[s1:s1 + L] += 0.05 * np.sin(2 * np.pi * note(ch[k % 3] + 24) * y) * np.exp(-y * 12)
    for k in range(4):
        s1 = s0 + int(k * beat * SR); L = min(int(0.22 * SR), N - s1)
        if L <= 0: continue
        y = np.arange(L) / SR
        if k % 2 == 0: M[s1:s1 + L] += 0.16 * np.sin(2 * np.pi * (50 + 80 * np.exp(-y * 30)) * y) * np.exp(-y * 14)
        else: M[s1:s1 + L] += 0.03 * lp(rng.standard_normal(L), 0.5) * np.exp(-y * 25)
M *= env(N, 1.0, 1.5)
venv = np.convolve(np.abs(V), np.ones(int(0.05 * SR)) / int(0.05 * SR), mode='same')
duck = np.convolve(np.where(venv > 0.01, 0.25, 1.0), np.ones(int(0.15 * SR)) / int(0.15 * SR), mode='same')
M *= duck

# ---------- efectos ----------
def whoosh(d=0.6): n = int(d * SR); return lp(noise(d), 0.08) * np.sin(np.linspace(0, np.pi, n)) ** 2 * 3
def pop(d=0.15): x = tt(d); return np.sin(2 * np.pi * (300 + 900 * np.exp(-x * 40)) * x) * np.exp(-x * 30)
def boing(d=0.6): x = tt(d); return np.sin(2 * np.pi * (180 + 120 * np.sin(x * 40) * np.exp(-x * 5)) * x) * np.exp(-x * 5)
def golpe(d=0.3): x = tt(d); return np.sin(2 * np.pi * (60 + 120 * np.exp(-x * 25)) * x) * np.exp(-x * 14) + 0.3 * lp(noise(d), 0.2) * np.exp(-x * 30)
def ding(d=1.0): x = tt(d); return (np.sin(2 * np.pi * 1568 * x) + 0.5 * np.sin(2 * np.pi * 2093 * x)) * np.exp(-x * 4) * 0.5
def campanita(d=1.2):
    x = tt(d); return sum(np.sin(2 * np.pi * f * (x - i * 0.12)) * np.exp(-np.clip(x - i * 0.12, 0, None) * 5) * (x > i * 0.12) for i, f in enumerate([1319, 1568, 2093])) * 0.3
def alarma(d=1.2):
    x = tt(d); return np.sign(np.sin(2 * np.pi * np.where((x * 4).astype(int) % 2, 880, 660) * x)) * 0.25 * env(len(x), 0.01, 0.05)
def latido(d=0.6): x = tt(d); b = lambda o: np.sin(2 * np.pi * 55 * (x - o)) * np.exp(-np.clip(x - o, 0, None) * 18) * (x > o); return b(0) + 0.7 * b(0.2)
def castaneo(d=1.5):
    n = int(d * SR); x = np.zeros(n); per = int(SR / 15)
    for i in range(0, n - 400, per): x[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 40)
    return x * env(n, 0.1, 0.2)
def ronquido(d=1.6): x = tt(d); return lp(noise(d), 0.03) * 4 * np.sin(np.pi * x / d) ** 2 * (1 + 0.5 * np.sin(2 * np.pi * 28 * x))
def glup(d=0.35): x = tt(d); return np.sin(2 * np.pi * (500 - 380 * x / d) * x) * np.exp(-x * 8)
def burbujas(d=1.0):
    out = np.zeros(int(d * SR))
    for k in range(8):
        s = int(rng.random() * (len(out) - 4000)); y = np.arange(3000) / SR
        out[s:s + 3000] += np.sin(2 * np.pi * (400 + 600 * rng.random() + 2000 * y) * y) * np.exp(-y * 40)
    return out
def zumbido(d=2.0): x = tt(d); return (np.sin(2 * np.pi * 90 * x) + 0.4 * np.sin(2 * np.pi * 180 * x)) * env(len(x), 0.3, 0.3) * 0.6
def viento(d=2.0): return lp(noise(d), 0.03) * 3 * env(int(d * SR), 0.5, 0.6)
def lluvia(d=3.0): return lp(noise(d), 0.25) * env(int(d * SR), 0.5, 0.5) * 0.5
def tictac(d=2.0):
    out = np.zeros(int(d * SR))
    for k, s in enumerate(np.arange(0, d - 0.05, 0.5)):
        y = tt(0.03); out[int(s * SR):int(s * SR) + len(y)] += np.sin(2 * np.pi * (2500 if k % 2 else 1800) * y) * np.exp(-y * 200)
    return out
def click(d=0.05): x = tt(d); return np.sin(2 * np.pi * 2200 * x) * np.exp(-x * 150)
def estomago(d=1.2): x = tt(d); return lp(noise(d), 0.02) * 5 * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + 4 * x) * x)) * env(len(x), 0.1, 0.3)
def bostezo_musical(d=1.4): x = tt(d); return np.sin(2 * np.pi * (330 - 140 * x / d) * x + 3 * np.sin(2 * np.pi * 5 * x)) * env(len(x), 0.2, 0.5) * 0.6
def risa_tuba(d=1.0):
    out = np.zeros(int(d * SR))
    for k, f in enumerate([98, 92, 87, 82]):
        y = tt(0.2); s = int(k * 0.22 * SR); out[s:s + len(y)] += (np.sin(2 * np.pi * f * y) + 0.5 * np.sin(2 * np.pi * 2 * f * y)) * np.exp(-y * 8)
    return out[:int(d * SR)]

SFX = {k: v for k, v in globals().items() if k in ['whoosh', 'pop', 'boing', 'golpe', 'ding', 'campanita', 'alarma', 'latido', 'castaneo', 'ronquido', 'glup', 'burbujas',
                                                   'zumbido', 'viento', 'lluvia', 'tictac', 'click', 'estomago', 'bostezo_musical', 'risa_tuba']}
GAIN = {'whoosh': 0.22, 'pop': 0.18, 'boing': 0.2, 'golpe': 0.35, 'ding': 0.08, 'campanita': 0.08, 'alarma': 0.05, 'latido': 0.35, 'castaneo': 0.12,
        'ronquido': 0.12, 'glup': 0.2, 'burbujas': 0.1, 'zumbido': 0.08, 'viento': 0.1, 'lluvia': 0.08, 'tictac': 0.12, 'click': 0.12, 'estomago': 0.15,
        'bostezo_musical': 0.1, 'risa_tuba': 0.18}
EFECTOS = 0.6  # volumen general de los efectos (el usuario los pidió más bajos)
S = np.zeros(N)
ev_path = os.path.join(D, 'eventos.json')
for e in (json.load(open(ev_path)) if os.path.exists(ev_path) else []):
    fn = SFX[e['sfx']]
    x = fn(e['d']) if 'd' in e else fn()
    i = int(e['t'] * SR); L = min(len(x), N - i)
    if L > 0: S[i:i + L] += EFECTOS * GAIN[e['sfx']] * e.get('g', 1.0) * x[:L]


# ---------- ambientes de fondo según la escena ----------
# <carpeta>/ambientes.json: [{"desde": 0, "hasta": 10.3, "tipo": "comedor"}, ...]  (fundidos de 0,6 s entre tramos)
def _bp(x, lo, hi):
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); X[(fr < lo) | (fr > hi)] = 0; return np.fft.irfft(X, len(x))
def _norm(x): m = np.max(np.abs(x)) or 1; return x / m
def _pings(d, cada, f0, f1, dec=40, g=1.0):
    out = np.zeros(int(d * SR)); t0 = 0.0
    while t0 < d:
        t0 += cada * (0.4 + rng.random() * 1.2)
        i = int(t0 * SR); y = tt(0.25); L = min(len(y), len(out) - i)
        if L > 0: out[i:i + L] += g * np.sin(2 * np.pi * (f0 + rng.random() * (f1 - f0)) * y[:L]) * np.exp(-y[:L] * dec)
    return out
def amb_comedor(d):
    n = int(d * SR); voces = _bp(rng.standard_normal(n), 250, 1600) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 2.7 * tt(d) + np.sin(tt(d) * 1.3) * 3)))
    return 0.8 * _norm(voces) + 0.5 * _pings(d, 1.6, 2600, 4200, 60)
def amb_noche(d):
    x = tt(d); grillo = np.sin(2 * np.pi * 4300 * x) * (np.sin(2 * np.pi * 28 * x) > 0.3) * (np.sin(2 * np.pi * 0.9 * x) > 0)
    return 0.5 * grillo + 0.8 * _norm(_bp(rng.standard_normal(len(x)), 80, 500))
def amb_lluvia(d): return _norm(_bp(rng.standard_normal(int(d * SR)), 800, 7000)) * 0.9
def amb_cuerpo(d):
    x = tt(d); lat = np.zeros(len(x))
    for t0 in np.arange(0, d, 0.95):
        for o, g in ((0, 1), (0.22, 0.7)):
            i = int((t0 + o) * SR); y = tt(0.3); L = min(len(y), len(x) - i)
            if L > 0: lat[i:i + L] += g * np.sin(2 * np.pi * 48 * y[:L]) * np.exp(-y[:L] * 16)
    return 0.9 * lat + 0.6 * _norm(_bp(rng.standard_normal(len(x)), 40, 220)) + 0.4 * _pings(d, 1.1, 300, 900, 30)
def amb_control(d):
    x = tt(d); return 0.4 * np.sin(2 * np.pi * 120 * x) + 0.2 * np.sin(2 * np.pi * 240 * x) + 0.7 * _pings(d, 0.9, 1500, 2200, 35) + 0.3 * _norm(_bp(rng.standard_normal(len(x)), 2000, 6000))
def amb_calle(d):
    x = tt(d); return 0.8 * _norm(_bp(rng.standard_normal(len(x)), 40, 300)) * (0.7 + 0.3 * np.sin(2 * np.pi * x / 6)) + 0.5 * _pings(d, 1.4, 3000, 5200, 25)
def amb_cocina(d):
    x = tt(d); return 0.7 * _norm(_bp(rng.standard_normal(len(x)), 3000, 9000)) * (0.6 + 0.4 * np.abs(np.sin(7 * x))) + 0.6 * _pings(d, 0.5, 200, 700, 30)
def amb_gimnasio(d):
    x = tt(d); return 0.6 * _norm(_bp(rng.standard_normal(len(x)), 200, 1200)) + 0.7 * _pings(d, 2.2, 180, 260, 9)
def amb_oficina(d):
    x = tt(d); return 0.5 * np.sin(2 * np.pi * 100 * x) * 0.3 + 0.5 * _norm(_bp(rng.standard_normal(len(x)), 100, 600)) + 0.8 * _pings(d, 0.18, 1800, 2600, 120)
def amb_naturaleza(d):
    x = tt(d); pajaro = _pings(d, 0.9, 2500, 4500, 18)
    return 0.7 * pajaro * (np.sin(2 * np.pi * 0.3 * x) > -0.3) + 0.7 * _norm(_bp(rng.standard_normal(len(x)), 100, 900)) * (0.6 + 0.4 * np.sin(x / 2))
AMB = {'comedor': amb_comedor, 'noche': amb_noche, 'lluvia': amb_lluvia, 'cuerpo': amb_cuerpo, 'control': amb_control, 'calle': amb_calle,
       'cocina': amb_cocina, 'gimnasio': amb_gimnasio, 'oficina': amb_oficina, 'naturaleza': amb_naturaleza}
AMB_GAIN = 0.06  # bajo: se siente de fondo sin tapar la voz
A = np.zeros(N)
amb_path = os.path.join(D, 'ambientes.json')
for a_ in (json.load(open(amb_path)) if os.path.exists(amb_path) else []):
    i0, i1 = int(a_['desde'] * SR), min(N, int(a_['hasta'] * SR))
    if i1 <= i0: continue
    x = _norm(AMB[a_['tipo']]((i1 - i0) / SR + 0.01)[:i1 - i0])
    A[i0:i1] += AMB_GAIN * a_.get('g', 1.0) * x * env(i1 - i0, 0.6, 0.6)
A *= np.convolve(np.where(venv > 0.01, 0.6, 1.0), np.ones(int(0.15 * SR)) / int(0.15 * SR), mode='same')

mix_ = V + 0.55 * M + S + A
peak = np.max(np.abs(mix_))
if peak > 0.98: mix_ *= 0.98 / peak
with wave.open(os.path.join(D, 'mezcla.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix_, -1, 1) * 32767).astype(np.int16).tobytes())
print('mezcla.wav lista · pico', round(peak, 3), '(voz sin alterar)' if peak <= 0.98 else '(se bajó todo para evitar saturación)')
