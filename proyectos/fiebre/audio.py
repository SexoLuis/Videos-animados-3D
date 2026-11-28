"""Música sintetizada + efectos sincronizados + narración original (sin alterar) -> video/public/mezcla.wav"""
import numpy as np, subprocess, wave
SR = 48000; DUR = 1600 / 30
N = int(SR * DUR); t = np.arange(N) / SR
rng = np.random.default_rng(7)

def voz():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'narracion.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    v = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    out = np.zeros(N); out[:min(N, len(v))] = v[:N]; return out
V = voz()

def env(n, a, r):
    e = np.ones(n); A = int(a * SR); R = int(r * SR)
    if A: e[:A] = np.linspace(0, 1, A)
    if R: e[-R:] *= np.linspace(1, 0, R)
    return e
def note(f): return 440 * 2 ** ((f - 69) / 12)

# ---------- música: 98 BPM, Am-F-C-G ----------
bpm = 98; beat = 60 / bpm; bar = beat * 4
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
M = np.zeros(N)
nb = int(DUR / bar) + 1
for b in range(nb):
    ch = chords[b % 4]; s0 = int(b * bar * SR); n = min(int(bar * SR), N - s0)
    if n <= 0: break
    tt = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * note(m) * tt) + 0.3 * np.sin(2 * np.pi * note(m) * 2.003 * tt) for m in ch)
    M[s0:s0 + n] += 0.05 * pad * env(n, 0.4, 0.5)
    bass = np.sin(2 * np.pi * note(ch[0] - 12) * tt) * np.exp(-tt * 1.2)
    M[s0:s0 + n] += 0.12 * bass
    for k in range(8):  # arpegio
        s1 = s0 + int(k * beat / 2 * SR); m = ch[k % 3] + 12 * (k // 3 % 2)
        L = min(int(0.4 * SR), N - s1)
        if L <= 0: continue
        tk = np.arange(L) / SR
        M[s1:s1 + L] += 0.045 * np.sin(2 * np.pi * note(m + 12) * tk) * np.exp(-tk * 7)
    for k in range(4):  # bombo suave + hi-hat
        s1 = s0 + int(k * beat * SR); L = min(int(0.25 * SR), N - s1)
        if L <= 0: continue
        tk = np.arange(L) / SR
        M[s1:s1 + L] += 0.18 * np.sin(2 * np.pi * (50 + 80 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 14)
        s2 = s1 + int(beat / 2 * SR); L2 = min(int(0.05 * SR), N - s2)
        if L2 > 0: M[s2:s2 + L2] += 0.025 * rng.standard_normal(L2) * np.exp(-np.arange(L2) / SR * 80)
M *= env(N, 1.0, 1.5)

# ducking: la música baja ~12 dB cuando habla el narrador
venv = np.convolve(np.abs(V), np.ones(int(0.05 * SR)) / int(0.05 * SR), mode='same')
duck = np.where(venv > 0.01, 0.25, 1.0)
k = int(0.15 * SR); duck = np.convolve(duck, np.ones(k) / k, mode='same')
M *= duck

# ---------- efectos ----------
S = np.zeros(N)
def add(s, x, g=1.0):
    i = int(s * SR); L = min(len(x), N - i)
    if L > 0: S[i:i + L] += g * x[:L]
def noise(d): return rng.standard_normal(int(d * SR))
def lp(x, a):  # filtro paso bajo de un polo
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def whoosh(d, up=True):
    n = int(d * SR); x = noise(d); e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return lp(x, 0.08) * e * 3
def tone_(f, d, dec=6): tt = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * tt) * np.exp(-tt * dec)
def clicks(d, rate):
    n = int(d * SR); x = np.zeros(n); per = int(SR / rate)
    for i in range(0, n - 400, per):
        c = rng.standard_normal(300) * np.exp(-np.arange(300) / 40); x[i:i + 300] += c * (0.6 + 0.4 * rng.random())
    return x

# lluvia (ambiente en el cuarto frío)
rain = lp(noise(DUR), 0.25)
rmask = np.zeros(N)
for a, b, g in [(0, 5.6, 1), (21.5, 24.6, 0.7), (31.2, 34.1, 0.5), (45.2, 52.9, 0.35)]:
    rmask[int(a * SR):int(b * SR)] = g
rmask = np.convolve(rmask, np.ones(SR // 3) / (SR // 3), mode='same')
S += 0.06 * rain * rmask
# castañeteo de dientes
add(0.3, clicks(4.9, 14) * env(int(4.9 * SR), 0.2, 0.4), 0.12)
add(21.6, clicks(3.0, 16) * env(int(3.0 * SR), 0.2, 0.3), 0.12)
add(52.8, clicks(0.55, 18), 0.14)
# zambullida al cerebro
add(5.4, whoosh(1.4), 0.25); add(6.0, tone_(880, 1.2, 3) + tone_(1320, 1.2, 4), 0.05)
# alarma (dos tonos)
for s in np.arange(8.85, 21.4, 0.6):
    add(s, np.sin(2 * np.pi * 880 * np.arange(int(0.25 * SR)) / SR) * env(int(0.25 * SR), 0.01, 0.05), 0.035)
for s in np.arange(34.1, 35.0, 0.6):
    add(s, np.sin(2 * np.pi * 880 * np.arange(int(0.25 * SR)) / SR) * env(int(0.25 * SR), 0.01, 0.05), 0.03)
# palanca arriba, calefactores
add(14.25, tone_(90, 0.5, 9), 0.4); add(14.25, lp(noise(0.3), 0.3) * np.exp(-np.arange(int(0.3 * SR)) / SR * 20), 0.4)
hum = np.sin(2 * np.pi * 70 * np.arange(int(7.2 * SR)) / SR) * env(int(7.2 * SR), 1.5, 0.5) + 0.3 * lp(noise(7.2), 0.02)
add(14.4, hum, 0.08)
# cobija que cae
add(23.2, whoosh(0.5), 0.2); add(23.63, lp(noise(0.25), 0.05) * np.exp(-np.arange(int(0.25 * SR)) / SR * 15), 0.5)
# latido lento en los vasos
for s in [24.7, 25.6, 26.6]:
    add(s, tone_(55, 0.25, 14), 0.35); add(s + 0.18, tone_(50, 0.25, 14), 0.25)
# músculos-motor (pulso a ~4,5 Hz)
mt = np.arange(int(3.4 * SR)) / SR
motor = (np.sin(2 * np.pi * 95 * mt) + 0.5 * np.sin(2 * np.pi * 190 * mt)) * (0.5 + 0.5 * np.sin(2 * np.pi * 4.5 * mt)) ** 2
add(27.85, motor * env(len(mt), 0.3, 0.3), 0.09)
# la cama tiembla
add(31.2, clicks(2.9, 22) * env(int(2.9 * SR), 0.1, 0.3) + 0.4 * lp(noise(2.9), 0.03), 0.12)
# palanca abajo, botón de enfriamiento y ventiladores
add(35.9, tone_(110, 0.4, 10), 0.35)
add(37.6, tone_(1200, 0.3, 12) + tone_(1800, 0.3, 14), 0.08)
add(37.7, whoosh(1.3) * 0.8 + 0.3 * lp(noise(1.3), 0.05), 0.25)
# vapor y sudor
add(39.0, lp(noise(2.8), 0.6) * env(int(2.8 * SR), 0.5, 0.8) * 0.5, 0.06)
# cobijas arrancadas
for s in [41.1, 42.15, 42.65]: add(s, whoosh(0.45), 0.3)
# ventana que se abre + brisa
add(44.1, tone_(420, 0.3, 8) * 0.5, 0.1); add(44.2, whoosh(1.6), 0.18)
# remate: escalofrío otra vez
add(52.75, tone_(1568, 0.6, 5) + tone_(2093, 0.6, 6), 0.05)

mix_ = V + 0.55 * M + S
peak = np.max(np.abs(mix_))
if peak > 0.98: mix_ *= 0.98 / peak  # solo si hubiera saturación
pcm = (np.clip(mix_, -1, 1) * 32767).astype(np.int16)
with wave.open('video/public/mezcla.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('pico', round(peak, 3))
