"""Escena de prueba de Titanoboa: animación 3D con Blender/Cycles, generada 100 % por código (reproducible).

Uso:
  blender -b --factory-startup --python titanoboa_escena.py -- [--salida DIR] [--muestras 48]
          [--escala 100] [--inicio 1] [--fin 120] [--fotogramas 1,60,120] [--guardar escena.blend]

  --escala      porcentaje de 1080x1920 (100 = resolución final)
  --fotogramas  renderiza solo esos fotogramas (pruebas rápidas); si no, el rango inicio-fin
Todo es procedural (sin texturas ni modelos externos). Semilla fija: el resultado es siempre el mismo.
"""
import bpy, bmesh, math, random, sys, os
from mathutils import Vector

# ---------------------------------------------------------------- argumentos
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(nombre, defecto):
    return argv[argv.index(nombre) + 1] if nombre in argv else defecto
SALIDA = os.path.abspath(arg('--salida', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fotogramas')))
MUESTRAS = int(arg('--muestras', 48))
ESCALA = int(arg('--escala', 100))
INICIO, FIN = int(arg('--inicio', 1)), int(arg('--fin', 120))
SOLO = [int(x) for x in arg('--fotogramas', '').split(',') if x]
GUARDAR = arg('--guardar', '')

R = random.Random(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
escena = bpy.context.scene
escena.frame_start, escena.frame_end = INICIO, FIN
escena.render.fps = 24

# ---------------------------------------------------------------- utilidades de materiales
def nodos(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    return nt, nt.nodes, nt.links

def rampa(nt, puntos, interp='LINEAR'):
    n = nt.nodes.new('ShaderNodeValToRGB')
    cr = n.color_ramp
    cr.interpolation = interp
    for i, (pos, col) in enumerate(puntos):
        el = cr.elements[i] if i < 2 else cr.elements.new(pos)
        el.position = pos
        el.color = (*col, 1.0) if len(col) == 3 else col
    return n

def hexa(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))

def matematica(nt, op, a=None, b=None, valor_b=None):
    n = nt.nodes.new('ShaderNodeMath')
    n.operation = op
    if a is not None:
        nt.links.new(a, n.inputs[0])
    if b is not None:
        nt.links.new(b, n.inputs[1])
    elif valor_b is not None:
        n.inputs[1].default_value = valor_b
    return n.outputs[0]

def mezcla(nt, fac, c1, c2, modo='MIX'):
    n = nt.nodes.new('ShaderNodeMixRGB')
    n.blend_type = modo
    for entrada, v in ((n.inputs['Fac'], fac), (n.inputs['Color1'], c1), (n.inputs['Color2'], c2)):
        if isinstance(v, (float, int)):
            entrada.default_value = v
        elif isinstance(v, tuple):
            entrada.default_value = (*v, 1.0)
        else:
            nt.links.new(v, entrada)
    return n.outputs['Color']

# ---------------------------------------------------------------- Titanoboa: malla
L = 13.0              # longitud (m): estimación de Titanoboa cerrejonensis
R_MAX = 0.45          # radio máximo del cuerpo (≈ 0,9 m de grosor)
M = 40                # vértices por anillo
CABEZA = 1.5          # longitud de la cabeza (m): ~2x su anchura, como en las boas
PASO = 0.025          # separación entre anillos (m)

def perfil(x):
    """semi-anchos (lateral, vertical) de la sección a la distancia x desde la cola"""
    if x < 3.2:                                   # cola afilada
        s = x / 3.2
        r = 0.035 + (R_MAX - 0.035) * (math.sin(s * math.pi / 2) ** 1.3)
        return r, r * 0.92
    cab = L - CABEZA
    if x < cab - 0.6:                             # cuerpo
        r = R_MAX * (1 + 0.03 * math.sin(x * 0.9))
        return r, r * 0.9
    if x < cab:                                   # cuello (se estrecha)
        s = (x - (cab - 0.6)) / 0.6
        r = R_MAX + (0.31 - R_MAX) * (0.5 - 0.5 * math.cos(s * math.pi))
        return r, r * 0.9
    s = (x - cab) / CABEZA                        # cabeza: 0 = nuca, 1 = hocico
    ancho = 0.31 + 0.06 * math.sin(min(1, s / 0.3) * math.pi / 2) if s < 0.3 else 0.37 - 0.22 * ((s - 0.3) / 0.7) ** 1.5
    alto = 0.27 - 0.05 * min(1, s / 0.3) - 0.10 * max(0, (s - 0.3) / 0.7) ** 1.1
    resto = L - x                                 # punta redondeada del hocico
    if resto < 0.12:
        k = math.sqrt(max(0.0, 1 - (1 - resto / 0.12) ** 2))
        ancho, alto = ancho * k, alto * k
    return max(ancho, 0.004), max(alto, 0.004)

bm = bmesh.new()
uv_capa = bm.loops.layers.uv.new('UVMap')
anillos = []
n_anillos = int(L / PASO) + 1
for i in range(n_anillos):
    x = min(L, i * PASO)
    w, h = perfil(x)
    anillo = []
    for j in range(M):
        a = 2 * math.pi * j / M
        y = w * math.cos(a)
        z = h * math.sin(a)
        if z < -0.78 * h:                         # vientre aplanado
            z = -0.78 * h + (z + 0.78 * h) * 0.25
        if x > L - CABEZA and z > 0:              # cabeza: parte superior más plana
            z *= 0.78
        anillo.append(bm.verts.new((x, y, z + 0.0)))
    anillos.append(anillo)
punta = bm.verts.new((L + 0.004, 0, -0.02))
bm.verts.ensure_lookup_table()
caras_cuerpo = []
for i in range(n_anillos - 1):
    for j in range(M):
        a, b = anillos[i][j], anillos[i][(j + 1) % M]
        c, d = anillos[i + 1][(j + 1) % M], anillos[i + 1][j]
        f = bm.faces.new((a, b, c, d))
        caras_cuerpo.append((f, i, j))
for j in range(M):
    bm.faces.new((anillos[-1][j], anillos[-1][(j + 1) % M], punta))
cola = bm.verts.new((-0.01, 0, 0))
for j in range(M):
    bm.faces.new((anillos[0][(j + 1) % M], anillos[0][j], cola))
# UV: u = metros a lo largo del cuerpo, v = fracción de vuelta (0..1)
for f, i, j in caras_cuerpo:
    xs = [i * PASO, i * PASO, (i + 1) * PASO, (i + 1) * PASO]
    vs = [j / M, (j + 1) / M, (j + 1) / M, j / M]
    for loop, u, v in zip(f.loops, xs, vs):
        loop[uv_capa].uv = (u, v)
idx_punta = punta.index

# Ojos (ámbar con pupila vertical) — material 1 y 2
def esfera(centro, radios, mat_idx):
    ret = bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1.0)
    for v in ret['verts']:
        v.co = Vector((v.co.x * radios[0], v.co.y * radios[1], v.co.z * radios[2])) + Vector(centro)
    for f in {f for v in ret['verts'] for f in v.link_faces}:
        f.material_index = mat_idx
xo = L - 0.62
for lado in (1, -1):
    w, h = perfil(xo)
    esfera((xo, lado * (w - 0.045), h * 0.18), (0.05, 0.035, 0.045), 1)
    esfera((xo + 0.004, lado * (w - 0.011), h * 0.18), (0.008, 0.004, 0.038), 2)

# Lengua bífida (material 3): base retraída; la clave de forma "fuera" la extiende
lengua = []
for k in range(14):
    t = k / 13
    for lado in (-1, 1):
        lengua.append(bm.verts.new((L - 0.3 + 0.25 * t, lado * 0.008, -0.06)))
for k in range(13):
    a, b, c, d = lengua[2 * k], lengua[2 * k + 1], lengua[2 * k + 3], lengua[2 * k + 2]
    f = bm.faces.new((a, b, c, d))
    f.material_index = 3

malla = bpy.data.meshes.new('Titanoboa')
bm.to_mesh(malla)
bm.free()
for p in malla.polygons:
    p.use_smooth = True
boa = bpy.data.objects.new('Titanoboa', malla)
escena.collection.objects.link(boa)
# clave de forma de la lengua
boa.shape_key_add(name='Base')
fuera = boa.shape_key_add(name='Fuera')
n_lengua = len(lengua)
ids_lengua = list(range(len(malla.vertices) - n_lengua, len(malla.vertices)))
for n, vid in enumerate(ids_lengua):
    k = n // 2
    lado = -1 if n % 2 == 0 else 1
    t = k / 13
    x = L - 0.05 + 0.42 * t
    abre = max(0.0, (t - 0.65) / 0.35)
    fuera.data[vid].co = Vector((x, lado * (0.008 + 0.07 * abre ** 1.3), -0.035 + 0.02 * math.sin(t * 3)))

# ---------------------------------------------------------------- materiales de la boa
piel = bpy.data.materials.new('Piel Titanoboa')
nt, N, Ln = nodos(piel)
salida = N.new('ShaderNodeOutputMaterial')
bsdf = N.new('ShaderNodeBsdfPrincipled')
Ln.new(bsdf.outputs[0], salida.inputs[0])
coord = N.new('ShaderNodeUVMap'); coord.uv_map = 'UVMap'
sep = N.new('ShaderNodeSeparateXYZ'); Ln.new(coord.outputs[0], sep.inputs[0])
X, V = sep.outputs[0], sep.outputs[1]
CIRC = 2.6
Vm = matematica(nt, 'MULTIPLY', V, valor_b=CIRC)
comb = N.new('ShaderNodeCombineXYZ'); Ln.new(X, comb.inputs[0]); Ln.new(Vm, comb.inputs[1])
# escamas
esc = N.new('ShaderNodeTexVoronoi'); esc.feature = 'DISTANCE_TO_EDGE'
esc.inputs['Scale'].default_value = 26; esc.inputs['Randomness'].default_value = 0.35
Ln.new(comb.outputs[0], esc.inputs['Vector'])
borde = rampa(nt, [(0.0, (0, 0, 0)), (0.09, (1, 1, 1))])
Ln.new(esc.outputs['Distance'], borde.inputs[0])
esc_c = N.new('ShaderNodeTexVoronoi'); esc_c.inputs['Scale'].default_value = 26; esc_c.inputs['Randomness'].default_value = 0.35
Ln.new(comb.outputs[0], esc_c.inputs['Vector'])
# manchas en silla de montar con borde negro
manch = N.new('ShaderNodeTexVoronoi'); manch.inputs['Scale'].default_value = 1.15; manch.inputs['Randomness'].default_value = 0.55
comb2 = N.new('ShaderNodeCombineXYZ'); Ln.new(X, comb2.inputs[0]); Ln.new(matematica(nt, 'MULTIPLY', Vm, valor_b=1.2), comb2.inputs[1])
ruido_m = N.new('ShaderNodeTexNoise'); ruido_m.inputs['Scale'].default_value = 3.0
Ln.new(comb2.outputs[0], ruido_m.inputs['Vector'])
desv = mezcla(nt, 0.18, comb2.outputs[0], ruido_m.outputs['Color'], 'LINEAR_LIGHT')
Ln.new(desv, manch.inputs['Vector'])
r_manch = rampa(nt, [(0.0, hexa('#2e1c0d')), (0.29, hexa('#3a2410')), (0.31, hexa('#0b0704')), (0.37, hexa('#0b0704')), (0.39, (1, 1, 1))])
Ln.new(manch.outputs['Distance'], r_manch.inputs[0])
f_manch = rampa(nt, [(0.0, (1, 1, 1)), (0.375, (1, 1, 1)), (0.39, (0, 0, 0))])
Ln.new(manch.outputs['Distance'], f_manch.inputs[0])
# máscaras dorsal / ventral según el ángulo
ang = matematica(nt, 'MULTIPLY', V, valor_b=2 * math.pi)
seno = matematica(nt, 'SINE', ang)
dorsal = matematica(nt, 'GREATER_THAN', seno, valor_b=-0.35)
ventral_s = N.new('ShaderNodeMapRange'); ventral_s.inputs['From Min'].default_value = -0.55; ventral_s.inputs['From Max'].default_value = -0.75
Ln.new(seno, ventral_s.inputs['Value'])
# color base oliva-bronce con variación
ruido_b = N.new('ShaderNodeTexNoise'); ruido_b.inputs['Scale'].default_value = 0.8; ruido_b.inputs['Detail'].default_value = 4
Ln.new(comb.outputs[0], ruido_b.inputs['Vector'])
base = rampa(nt, [(0.25, hexa('#3f4417')), (0.55, hexa('#5a5a1e')), (0.85, hexa('#7a5f22'))])
Ln.new(ruido_b.outputs['Fac'], base.inputs[0])
var_esc = mezcla(nt, 0.12, base.outputs[0], esc_c.outputs['Color'], 'OVERLAY')
fac_manchas = matematica(nt, 'MULTIPLY', f_manch.outputs[0], dorsal)
sin_cabeza = matematica(nt, 'LESS_THAN', X, valor_b=L - CABEZA + 0.05)   # sin manchas en la cabeza
fac_manchas = matematica(nt, 'MULTIPLY', fac_manchas, sin_cabeza)
col = mezcla(nt, fac_manchas, var_esc, r_manch.outputs[0])
# vientre crema con escudos transversales
ondas = N.new('ShaderNodeTexWave'); ondas.wave_type = 'BANDS'; ondas.bands_direction = 'X'
ondas.inputs['Scale'].default_value = 3.0
Ln.new(comb.outputs[0], ondas.inputs['Vector'])
vientre = mezcla(nt, 0.3, (0.48, 0.42, 0.26), ondas.outputs['Color'], 'MULTIPLY')
col = mezcla(nt, ventral_s.outputs[0], col, vientre)
# surcos entre escamas más oscuros
oscuro = mezcla(nt, 0.55, col, (0.02, 0.015, 0.01), 'MULTIPLY')
col_final = mezcla(nt, borde.outputs[0], oscuro, col)
Ln.new(col_final, bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.42
bsdf.inputs['Coat Weight'].default_value = 0.25
bsdf.inputs['Coat Roughness'].default_value = 0.25
bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.55; bump.inputs['Distance'].default_value = 0.012
Ln.new(borde.outputs[0], bump.inputs['Height'])
Ln.new(bump.outputs[0], bsdf.inputs['Normal'])

ojo = bpy.data.materials.new('Ojo'); nt, N, Ln = nodos(ojo)
o_out = N.new('ShaderNodeOutputMaterial'); o_b = N.new('ShaderNodeBsdfPrincipled'); Ln.new(o_b.outputs[0], o_out.inputs[0])
o_b.inputs['Base Color'].default_value = (*hexa('#e0a21c'), 1); o_b.inputs['Roughness'].default_value = 0.08
o_b.inputs['Coat Weight'].default_value = 1.0; o_b.inputs['Emission Color'].default_value = (*hexa('#ffb02a'), 1)
o_b.inputs['Emission Strength'].default_value = 0.25
pupila = bpy.data.materials.new('Pupila'); nt, N, Ln = nodos(pupila)
p_out = N.new('ShaderNodeOutputMaterial'); p_b = N.new('ShaderNodeBsdfPrincipled'); Ln.new(p_b.outputs[0], p_out.inputs[0])
p_b.inputs['Base Color'].default_value = (0.005, 0.004, 0.003, 1); p_b.inputs['Roughness'].default_value = 0.05
lmat = bpy.data.materials.new('Lengua'); nt, N, Ln = nodos(lmat)
l_out = N.new('ShaderNodeOutputMaterial'); l_b = N.new('ShaderNodeBsdfPrincipled'); Ln.new(l_b.outputs[0], l_out.inputs[0])
l_b.inputs['Base Color'].default_value = (0.08, 0.02, 0.03, 1); l_b.inputs['Roughness'].default_value = 0.25
for m in (piel, ojo, pupila, lmat):
    malla.materials.append(m)

# ---------------------------------------------------------------- trayectoria (curva) y animación del cuerpo
curva_d = bpy.data.curves.new('Trayectoria', 'CURVE')
curva_d.dimensions = '3D'; curva_d.twist_mode = 'Z_UP'; curva_d.resolution_u = 32
spl = curva_d.splines.new('BEZIER')
PUNTOS = [(7.5, 13, 0.40), (3, 10.5, 0.40), (-2.5, 9.5, 0.40), (-4.2, 5.5, 0.40), (-2.0, 2.4, 0.40),
          (1.3, 1.2, 0.42), (1.15, -0.35, 0.50), (0.55, -1.25, 0.80), (0.25, -2.35, 0.85)]
# posiciones finales de los 3 últimos puntos: el cuello se alza y la cabeza queda horizontal mirando a cámara
FINAL = {6: (1.15, -0.4, 0.62), 7: (0.6, -1.3, 1.22), 8: (0.22, -2.4, 1.32)}
spl.bezier_points.add(len(PUNTOS) - 1)
for bp, co in zip(spl.bezier_points, PUNTOS):
    bp.co = co
    bp.handle_left_type = bp.handle_right_type = 'AUTO'
curva = bpy.data.objects.new('Trayectoria', curva_d)
escena.collection.objects.link(curva)
for f in range(INICIO, FIN + 1, 4):
    t = (f - INICIO) / max(1, FIN - INICIO)
    sube = 0.5 - 0.5 * math.cos(min(1.0, t * 1.25) * math.pi)
    vaiv = math.sin(t * math.pi * 1.6) * 0.12
    for k in (6, 7, 8):
        bp = spl.bezier_points[k]
        a0, a1 = Vector(PUNTOS[k]), Vector(FINAL[k])
        co = a0.lerp(a1, sube)
        co.x += vaiv * (k - 5) / 3
        bp.co = co
        bp.keyframe_insert('co', frame=f)
largo = spl.calc_length()
mod = boa.modifiers.new('Curva', 'CURVE'); mod.object = curva; mod.deform_axis = 'POS_X'
# el cuerpo se desliza por la curva (la cabeza llega cerca del final al acabar)
x_fin = largo - L - 0.25
boa.location.x = x_fin - 0.5
boa.keyframe_insert('location', index=0, frame=INICIO)
boa.location.x = x_fin
boa.keyframe_insert('location', index=0, frame=FIN)
for fc in boa.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'SINE'; kp.easing = 'EASE_IN_OUT'
# lengua: dos movimientos rápidos
kb = malla.shape_keys.key_blocks['Fuera']
for f, v in ((INICIO, 0), (64, 0), (68, 1), (71, 0.3), (74, 1), (79, 0), (100, 0), (104, 1), (108, 0.2), (111, 1), (116, 0)):
    if INICIO <= f <= FIN:
        kb.value = v; kb.keyframe_insert('value', frame=f)

# ---------------------------------------------------------------- suelo
bpy.ops.mesh.primitive_grid_add(x_subdivisions=160, y_subdivisions=160, size=70, location=(0, 12, 0))
suelo = bpy.context.active_object; suelo.name = 'Suelo'
tex = bpy.data.textures.new('Relieve', 'CLOUDS'); tex.noise_scale = 3.5
dsp = suelo.modifiers.new('Relieve', 'DISPLACE'); dsp.texture = tex; dsp.strength = 0.35; dsp.mid_level = 0.6
for p in suelo.data.polygons:
    p.use_smooth = True
tierra = bpy.data.materials.new('Suelo selva'); nt, N, Ln = nodos(tierra)
t_out = N.new('ShaderNodeOutputMaterial'); t_b = N.new('ShaderNodeBsdfPrincipled'); Ln.new(t_b.outputs[0], t_out.inputs[0])
t_n = N.new('ShaderNodeTexNoise'); t_n.inputs['Scale'].default_value = 1.6; t_n.inputs['Detail'].default_value = 8
t_r = rampa(nt, [(0.35, hexa('#2c2112')), (0.5, hexa('#4a3a1f')), (0.62, hexa('#2f4a18')), (0.75, hexa('#3d5c1d'))])
Ln.new(t_n.outputs['Fac'], t_r.inputs[0]); Ln.new(t_r.outputs[0], t_b.inputs['Base Color'])
t_b.inputs['Roughness'].default_value = 0.9
t_bump = N.new('ShaderNodeBump'); t_bump.inputs['Strength'].default_value = 0.6
t_n2 = N.new('ShaderNodeTexNoise'); t_n2.inputs['Scale'].default_value = 25; t_n2.inputs['Detail'].default_value = 6
Ln.new(t_n2.outputs['Fac'], t_bump.inputs['Height']); Ln.new(t_bump.outputs[0], t_b.inputs['Normal'])
suelo.data.materials.append(tierra)

# ---------------------------------------------------------------- vegetación
def material_hoja(nombre, c1, c2, trans=0.35):
    m = bpy.data.materials.new(nombre); nt, N, Ln = nodos(m)
    out = N.new('ShaderNodeOutputMaterial')
    pr = N.new('ShaderNodeBsdfPrincipled'); tr = N.new('ShaderNodeBsdfTranslucent')
    mx = N.new('ShaderNodeMixShader'); mx.inputs[0].default_value = trans
    info = N.new('ShaderNodeObjectInfo')
    rr = rampa(nt, [(0.0, hexa(c1)), (1.0, hexa(c2))]); Ln.new(info.outputs['Random'], rr.inputs[0])
    Ln.new(rr.outputs[0], pr.inputs['Base Color'])
    tc = mezcla(nt, 1.0, rr.outputs[0], (0.9, 1.0, 0.35), 'MULTIPLY'); Ln.new(tc, tr.inputs['Color'])
    pr.inputs['Roughness'].default_value = 0.45; pr.inputs['Coat Weight'].default_value = 0.1
    Ln.new(pr.outputs[0], mx.inputs[1]); Ln.new(tr.outputs[0], mx.inputs[2]); Ln.new(mx.outputs[0], out.inputs[0])
    return m

mat_helecho = material_hoja('Helecho', '#2f5a17', '#5c8a24')
mat_hoja = material_hoja('Hoja grande', '#24480f', '#4f7d1f', 0.45)

def malla_helecho(nombre, frondas=8, largo=1.25, pinnas=22):
    bm = bmesh.new()
    for fi in range(frondas):
        giro = 2 * math.pi * fi / frondas + R.uniform(-0.2, 0.2)
        incl = math.radians(R.uniform(35, 62))
        lf = largo * R.uniform(0.75, 1.1)
        def punto(t):  # raquis arqueado
            r = lf * t
            z = math.sin(incl) * r - 0.55 * lf * t * t
            h = math.cos(incl) * r
            return Vector((math.cos(giro) * h, math.sin(giro) * h, z))
        lateral = Vector((-math.sin(giro), math.cos(giro), 0))
        for p in range(pinnas):
            t = (p + 1) / (pinnas + 1)
            base = punto(t); sig = punto(min(1, t + 0.04))
            dirr = (sig - base).normalized()
            lp = 0.22 * lf * math.sin(math.pi * t) ** 0.8 + 0.02
            for lado in (-1, 1):
                ext = (lateral * lado * 0.85 + dirr * 0.5).normalized()
                punta_p = base + ext * lp + Vector((0, 0, -0.04 * lp))
                medio = base + ext * lp * 0.45
                ancho = dirr * 0.018 * (1 + lp * 3)
                vs = [bm.verts.new(base), bm.verts.new(medio + ancho), bm.verts.new(punta_p), bm.verts.new(medio - ancho)]
                bm.faces.new(vs)
    m = bpy.data.meshes.new(nombre); bm.to_mesh(m); bm.free()
    m.materials.append(mat_helecho)
    return m

def malla_hoja(nombre, largo=1.6, ancho=0.55):
    bm = bmesh.new(); filas, cols = 24, 10
    vs = []
    for i in range(filas + 1):
        v = i / filas; fila = []
        w = math.sin(math.pi * min(1, v * 1.05)) ** 0.75 * ancho
        for j in range(cols + 1):
            u = (j / cols) * 2 - 1
            x = u * w; y = v * largo
            z = 0.45 * largo * math.sin(v * 1.2) - 0.75 * largo * v * v + 0.12 * abs(u) * w
            fila.append(bm.verts.new((x, y, z)))
        vs.append(fila)
    for i in range(filas):
        for j in range(cols):
            bm.faces.new((vs[i][j], vs[i][j + 1], vs[i + 1][j + 1], vs[i + 1][j]))
    m = bpy.data.meshes.new(nombre); bm.to_mesh(m); bm.free()
    for p in m.polygons:
        p.use_smooth = True
    m.materials.append(mat_hoja)
    return m

def viento(obj, fuerza=0.06, escala=18):
    obj.keyframe_insert('rotation_euler', frame=INICIO)
    for fc in obj.animation_data.action.fcurves:
        if fc.data_path == 'rotation_euler' and fc.array_index in (0, 1):
            nz = fc.modifiers.new('NOISE'); nz.strength = fuerza; nz.scale = escala; nz.phase = R.uniform(0, 100)

helechos = [malla_helecho(f'Helecho{i}') for i in range(4)]
def en_pasillo(x, y):  # dejar despejada la vista de la cámara hacia la cabeza
    return -1.1 < x < 1.6 and -7 < y < 0.5
colocados = 0
while colocados < 420:
    x, y = R.uniform(-8, 8), R.uniform(-7.5, 12)
    if en_pasillo(x, y):
        continue
    o = bpy.data.objects.new('Helecho', R.choice(helechos))
    s = R.uniform(0.8, 1.6) * (1.0 if y > 0 else 0.85)
    o.location = (x, y, 0.15); o.scale = (s, s, s); o.rotation_euler = (0, 0, R.uniform(0, 6.28))
    escena.collection.objects.link(o); viento(o, 0.045, R.uniform(14, 24)); colocados += 1
# helechos junto al cuerpo (la serpiente emerge entre ellos)
for x, y in ((1.9, 0.6), (-0.9, 1.6), (2.2, -1.4), (-1.5, -0.4), (0.4, 2.5), (2.6, 2.2), (-1.4, -2.3)):
    o = bpy.data.objects.new('Helecho', R.choice(helechos)); s = R.uniform(1.1, 1.5)
    o.location = (x, y, 0.15); o.scale = (s, s, s); o.rotation_euler = (0, 0, R.uniform(0, 6.28))
    escena.collection.objects.link(o); viento(o, 0.05, 16)
# plantas bajas en el pasillo de la cámara (cubren el suelo sin tapar la vista)
bajo = malla_helecho('HelechoBajo', frondas=7, largo=0.5, pinnas=14)
for _ in range(110):
    x, y = R.uniform(-1.4, 1.9), R.uniform(-8, 0.5)
    o = bpy.data.objects.new('HelechoBajo', bajo); s_ = R.uniform(0.5, 1.0)
    o.location = (x, y, 0.12); o.scale = (s_, s_, s_ * 0.8); o.rotation_euler = (0, 0, R.uniform(0, 6.28))
    escena.collection.objects.link(o); viento(o, 0.05, R.uniform(12, 20))
# hojas grandes en primer plano (desenfocadas, dan profundidad) y a media distancia
hoja_m = malla_hoja('HojaGrande')
for (x, y, z, rz, rx, s) in ((-0.95, -6.6, 0.1, -0.5, 0.2, 1.1), (1.25, -6.3, 0.0, 0.7, 0.1, 1.0),
                             (-1.3, -5.2, 0.0, -0.2, 0.0, 1.3), (1.9, -3.8, 0.0, 0.9, 0.0, 1.4),
                             (-2.4, -1.5, 0.0, -0.8, 0.0, 1.6), (2.8, 0.4, 0.0, 1.1, 0.0, 1.7)):
    o = bpy.data.objects.new('Hoja', hoja_m); o.location = (x, y, z)
    o.rotation_euler = (rx, 0, rz); o.scale = (s, s, s)
    escena.collection.objects.link(o); viento(o, 0.07, 14)

# troncos, copas y lianas
corteza = bpy.data.materials.new('Corteza'); nt, N, Ln = nodos(corteza)
c_out = N.new('ShaderNodeOutputMaterial'); c_b = N.new('ShaderNodeBsdfPrincipled'); Ln.new(c_b.outputs[0], c_out.inputs[0])
c_w = N.new('ShaderNodeTexWave'); c_w.wave_type = 'BANDS'; c_w.bands_direction = 'Z'; c_w.inputs['Scale'].default_value = 2; c_w.inputs['Distortion'].default_value = 8
c_r = rampa(nt, [(0.2, hexa('#16110b')), (0.8, hexa('#3a3226'))]); Ln.new(c_w.outputs['Fac'], c_r.inputs[0]); Ln.new(c_r.outputs[0], c_b.inputs['Base Color'])
c_bp = N.new('ShaderNodeBump'); Ln.new(c_w.outputs['Fac'], c_bp.inputs['Height']); Ln.new(c_bp.outputs[0], c_b.inputs['Normal'])
c_b.inputs['Roughness'].default_value = 0.85
copa = material_hoja('Copa', '#1d3d0e', '#3a6418', 0.25)
for i in range(26):
    while True:
        x, y = R.uniform(-14, 14), R.uniform(3, 30)
        if not (-3 < x < 4 and y < 8):
            break
    r = R.uniform(0.3, 0.75); alto = R.uniform(14, 22)
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=r, depth=alto, location=(x, y, alto / 2 - 0.3))
    t = bpy.context.active_object; t.data.materials.append(corteza)
    t.rotation_euler = (R.uniform(-0.05, 0.05), R.uniform(-0.05, 0.05), 0)
    for _ in range(3):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=R.uniform(2.5, 4.5),
                                              location=(x + R.uniform(-2, 2), y + R.uniform(-2, 2), alto + R.uniform(0, 3)))
        c = bpy.context.active_object; c.scale.z = 0.6; c.data.materials.append(copa)
        for pp in c.data.polygons: pp.use_smooth = True
        d = c.modifiers.new('Hojas', 'DISPLACE'); tx = bpy.data.textures.new('copa', 'CLOUDS'); tx.noise_scale = 0.8
        d.texture = tx; d.strength = 1.2
for i in range(16):  # lianas colgantes
    x, y = R.uniform(-7, 7), R.uniform(2, 14)
    if en_pasillo(x, y):
        continue
    cd = bpy.data.curves.new('Liana', 'CURVE'); cd.dimensions = '3D'; cd.bevel_depth = R.uniform(0.015, 0.035)
    sp = cd.splines.new('NURBS'); sp.points.add(4)
    for k, p in enumerate(sp.points):
        p.co = (x + R.uniform(-0.3, 0.3), y + R.uniform(-0.3, 0.3), 16 - k * R.uniform(2.5, 3.5), 1)
    sp.use_endpoint_u = True
    lo = bpy.data.objects.new('Liana', cd); cd.materials.append(corteza); escena.collection.objects.link(lo)
    viento(lo, 0.02, 30)

# motas de polvo iluminadas
mota_m = bpy.data.materials.new('Mota'); nt, N, Ln = nodos(mota_m)
m_out = N.new('ShaderNodeOutputMaterial'); m_e = N.new('ShaderNodeEmission'); Ln.new(m_e.outputs[0], m_out.inputs[0])
m_e.inputs['Color'].default_value = (1.0, 0.85, 0.55, 1); m_e.inputs['Strength'].default_value = 6
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.008)
mota_base = bpy.context.active_object; mota_base.data.materials.append(mota_m); mota_base.hide_render = True; mota_base.hide_viewport = True
for i in range(70):
    o = bpy.data.objects.new('Mota', mota_base.data)
    o.location = (R.uniform(-2.5, 3), R.uniform(-5.5, 3), R.uniform(0.3, 3.2))
    escena.collection.objects.link(o)
    o.keyframe_insert('location', frame=INICIO)
    for fc in o.animation_data.action.fcurves:
        nz = fc.modifiers.new('NOISE'); nz.strength = 0.35; nz.scale = 60; nz.phase = R.uniform(0, 100)

# ---------------------------------------------------------------- luz: atardecer a contraluz
mundo = bpy.data.worlds.new('Cielo'); escena.world = mundo; nt, N, Ln = nodos(mundo)
w_out = N.new('ShaderNodeOutputWorld'); fondo = N.new('ShaderNodeBackground'); cielo = N.new('ShaderNodeTexSky')
cielo.sky_type = 'NISHITA'; cielo.sun_elevation = math.radians(9); cielo.sun_rotation = math.radians(135)
cielo.air_density = 1.4; cielo.dust_density = 3.0
Ln.new(cielo.outputs[0], fondo.inputs[0]); fondo.inputs[1].default_value = 0.35; Ln.new(fondo.outputs[0], w_out.inputs[0])
sol_d = bpy.data.lights.new('Sol', 'SUN'); sol_d.energy = 6.0; sol_d.color = (1.0, 0.72, 0.42); sol_d.angle = math.radians(1.5)
sol = bpy.data.objects.new('Sol', sol_d); escena.collection.objects.link(sol)
sol.rotation_euler = (math.radians(78), 0, math.radians(135 + 180))
rel_d = bpy.data.lights.new('Relleno', 'AREA'); rel_d.energy = 220; rel_d.size = 4; rel_d.color = (1.0, 0.86, 0.68)
rel = bpy.data.objects.new('Relleno', rel_d); rel.location = (3.5, -6, 3); escena.collection.objects.link(rel)
rt = rel.constraints.new('TRACK_TO'); rt.target = boa
mundo.mist_settings.start = 6; mundo.mist_settings.depth = 45; mundo.mist_settings.falloff = 'QUADRATIC'

# ---------------------------------------------------------------- cámara
cam_d = bpy.data.cameras.new('Camara'); cam_d.lens = 35; cam_d.sensor_width = 36
cam_d.dof.use_dof = True; cam_d.dof.aperture_fstop = 2.2; cam_d.dof.aperture_blades = 7
cam = bpy.data.objects.new('Camara', cam_d); escena.collection.objects.link(cam); escena.camera = cam
objetivo = bpy.data.objects.new('Objetivo', None); escena.collection.objects.link(objetivo)
tc = cam.constraints.new('TRACK_TO'); tc.target = objetivo; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
for f, loc in ((INICIO, (1.35, -7.6, 2.05)), (FIN, (0.45, -5.0, 1.85))):
    cam.location = loc; cam.keyframe_insert('location', frame=f)
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'SINE'; kp.easing = 'EASE_IN_OUT'
    nz = fc.modifiers.new('NOISE'); nz.strength = 0.012; nz.scale = 25; nz.phase = R.uniform(0, 50)  # cámara en mano sutil

# Seguir la cabeza: se evalúa la escena fotograma a fotograma para colocar el objetivo y el foco
hoja_cercana = Vector((-0.95, -6.6, 0.55))
dg = bpy.context.evaluated_depsgraph_get()
prev = None
for f in range(INICIO, FIN + 1):
    escena.frame_set(f)
    ev = boa.evaluated_get(dg)
    cabeza = ev.matrix_world @ ev.data.vertices[idx_punta].co
    ojo_p = cabeza + Vector((0, 0.45, 0.05))
    cpos0 = cam.matrix_world.translation
    linea = (cabeza - cpos0); linea.z = 0; linea.normalize()
    destino = cabeza + linea * 1.6 + Vector((0, 0, -0.8))   # cabeza centrada, en el tercio superior; el cuerpo llena el centro
    prev = destino if prev is None else prev.lerp(destino, 0.4)  # retardo suave
    objetivo.location = prev; objetivo.keyframe_insert('location', frame=f)
    cpos = cam.matrix_world.translation
    d_cab = (ojo_p - cpos).length
    d_hoja = (hoja_cercana - cpos).length
    k = min(1.0, max(0.0, (f - 18) / 28.0)); k = k * k * (3 - 2 * k)  # cambio de foco hoja → cabeza
    cam_d.dof.focus_distance = d_hoja + (d_cab - d_hoja) * k
    cam_d.dof.keyframe_insert('focus_distance', frame=f)

# ---------------------------------------------------------------- render
rd = escena.render
rd.engine = 'CYCLES'; c = escena.cycles; c.device = 'CPU'
c.samples = MUESTRAS; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.04
c.max_bounces = 6; c.diffuse_bounces = 2; c.glossy_bounces = 2; c.transmission_bounces = 4; c.transparent_max_bounces = 6
c.caustics_reflective = c.caustics_refractive = False; c.blur_glossy = 1.0; c.sample_clamp_indirect = 4.0
c.use_light_tree = True
c.use_denoising = False          # este Blender (Ubuntu) no trae OIDN; el ruido se limpia con ffmpeg
c.use_preview_denoising = False
rd.resolution_x, rd.resolution_y, rd.resolution_percentage = 1080, 1920, ESCALA
rd.use_persistent_data = True
rd.image_settings.file_format = 'PNG'; rd.image_settings.color_depth = '8'
escena.view_settings.view_transform = 'AgX'; escena.view_settings.look = 'AgX - Medium High Contrast'
escena.view_settings.exposure = 0.0
vl = escena.view_layers[0]; vl.use_pass_mist = True
# composición: neblina atmosférica, rayos de sol y brillo
escena.use_nodes = True; ct = escena.node_tree
for n in list(ct.nodes):
    ct.nodes.remove(n)
rl = ct.nodes.new('CompositorNodeRLayers'); comp = ct.nodes.new('CompositorNodeComposite')
niebla = ct.nodes.new('CompositorNodeMixRGB'); niebla.inputs[2].default_value = (0.95, 0.72, 0.42, 1)
fac = ct.nodes.new('CompositorNodeMath'); fac.operation = 'MULTIPLY'; fac.inputs[1].default_value = 0.38
ct.links.new(rl.outputs['Mist'], fac.inputs[0]); ct.links.new(fac.outputs[0], niebla.inputs[0]); ct.links.new(rl.outputs['Image'], niebla.inputs[1])
rayos = ct.nodes.new('CompositorNodeSunBeams'); rayos.source = (0.12, 0.92); rayos.ray_length = 0.32
ct.links.new(niebla.outputs[0], rayos.inputs[0])
suma = ct.nodes.new('CompositorNodeMixRGB'); suma.blend_type = 'SCREEN'; suma.inputs[0].default_value = 0.28
ct.links.new(niebla.outputs[0], suma.inputs[1]); ct.links.new(rayos.outputs[0], suma.inputs[2])
brillo = ct.nodes.new('CompositorNodeGlare'); brillo.glare_type = 'FOG_GLOW'; brillo.threshold = 0.85; brillo.size = 7; brillo.mix = -0.86
ct.links.new(suma.outputs[0], brillo.inputs[0])
ct.links.new(brillo.outputs[0], comp.inputs[0])

if GUARDAR:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(GUARDAR))
os.makedirs(SALIDA, exist_ok=True)
for f in (SOLO or range(INICIO, FIN + 1)):
    escena.frame_set(f)
    rd.filepath = os.path.join(SALIDA, f'f{f:04d}.png')
    bpy.ops.render.render(write_still=True)
    print(f'RENDER fotograma {f} -> {rd.filepath}', flush=True)
