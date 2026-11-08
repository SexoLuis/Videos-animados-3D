"""Escena 1 del reel «Si un perro agresivo se acerca», hecha 100 % con código en Blender/Cycles.

Nubo (personaje original: cabeza blanca redonda, camiseta verde menta, extremidades finas)
se asusta en un camino de parque cuando un perro callejero le gruñe.

Uso:
  blender -b --factory-startup --python escena_gancho.py -- [--salida DIR] [--muestras 24]
          [--escala 50] [--inicio 1] [--fin 120] [--fotogramas 1,60,120]
Todo es procedural y con semilla fija: el resultado es siempre el mismo.
"""
import bpy, math, random, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d):
    return argv[argv.index(n) + 1] if n in argv else d
SALIDA = os.path.abspath(arg('--salida', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fotogramas')))
MUESTRAS = int(arg('--muestras', 24))
ESCALA = int(arg('--escala', 50))
INICIO, FIN = int(arg('--inicio', 1)), int(arg('--fin', 240))
SOLO = [int(x) for x in arg('--fotogramas', '').split(',') if x]

R = random.Random(11)
bpy.ops.wm.read_factory_settings(use_empty=True)
esc = bpy.context.scene
esc.frame_start, esc.frame_end = INICIO, FIN
esc.render.fps = 24

# ------------------------------------------------------------------ materiales
def hexa(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))

def principled(nombre, color, rough=0.5, **extra):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexa(color), 1)
    b.inputs['Roughness'].default_value = rough
    for k, v in extra.items():
        if k in b.inputs:
            b.inputs[k].default_value = v
    return m

def con_ruido(m, color2, escala=8.0, bump=0.0, detalle=4.0):
    """Mezcla el color base con un segundo color según un ruido (y bump opcional)."""
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    rn = nt.nodes.new('ShaderNodeTexNoise')
    rn.inputs['Scale'].default_value = escala
    rn.inputs['Detail'].default_value = detalle
    nt.links.new(tc.outputs['Object'], rn.inputs['Vector'])
    mx = nt.nodes.new('ShaderNodeMixRGB')
    mx.inputs['Color1'].default_value = b.inputs['Base Color'].default_value[:]
    mx.inputs['Color2'].default_value = (*hexa(color2), 1)
    nt.links.new(rn.outputs['Fac'], mx.inputs['Fac'])
    nt.links.new(mx.outputs['Color'], b.inputs['Base Color'])
    if bump:
        bp = nt.nodes.new('ShaderNodeBump')
        bp.inputs['Strength'].default_value = bump
        nt.links.new(rn.outputs['Fac'], bp.inputs['Height'])
        nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

M_PIEL = principled('Nubo cabeza', '#f4f2ee', 0.28, **{'Subsurface Weight': 0.15, 'Coat Weight': 0.35})
M_OJO = principled('Ojo', '#050505', 0.05, **{'Coat Weight': 1.0})
M_BRILLO = principled('Brillo ojo', '#ffffff', 0.2, **{'Emission Color': (1, 1, 1, 1), 'Emission Strength': 2.0})
M_BOCA = principled('Boca', '#3a0c10', 0.6)
M_LENGUA = principled('Lengua', '#c4545c', 0.5)
M_CEJA = principled('Ceja', '#1d1d1f', 0.5)
M_CAMISA = con_ruido(principled('Camiseta', '#5fd3b0', 0.85, **{'Sheen Weight': 0.4}), '#4fbf9d', 60, 0.08)
M_EXTREM = principled('Extremidades', '#2b2d31', 0.45)
M_ZAPA = principled('Zapatilla', '#f7f7f7', 0.5)
M_SUELA = principled('Suela', '#cfd3d6', 0.6)
M_CORDON = principled('Cordón', '#5fd3b0', 0.6)
M_SUDOR = principled('Sudor', '#9fd8ff', 0.02, **{'Transmission Weight': 0.85, 'IOR': 1.33})
M_PERRO = con_ruido(principled('Perro pelo', '#8a5a34', 0.8, **{'Sheen Weight': 0.6}), '#5e3a1f', 25, 0.25, 8)
M_PERRO_CLARO = con_ruido(principled('Perro claro', '#c09060', 0.8), '#9a6c42', 25, 0.2, 8)
M_NARIZ = principled('Nariz', '#121212', 0.15)
M_OJO_PERRO = principled('Ojo perro', '#ff2a10', 0.1, **{'Emission Color': (*hexa('#ff2a10'), 1), 'Emission Strength': 1.2})
M_DIENTE = principled('Diente', '#f3eee0', 0.3)
M_ENCIA = principled('Encía', '#7a1f28', 0.5)

def asignar(o, m):
    o.data.materials.clear()
    o.data.materials.append(m)
    return o

def suave(o, niveles=2):
    for p in o.data.polygons:
        p.use_smooth = True
    if niveles:
        s = o.modifiers.new('sub', 'SUBSURF')
        s.levels = s.render_levels = niveles
    return o

# ------------------------------------------------------------------ primitivas
def esfera(nombre, pos, radios, mat, padre=None, seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=1, location=pos)
    o = bpy.context.object
    o.name = nombre
    o.scale = radios
    asignar(o, mat)
    suave(o, 1)
    if padre:
        o.parent = padre
        o.matrix_parent_inverse = padre.matrix_world.inverted()
    return o

def cilindro(nombre, a, b, r, mat, padre=None, r2=None, seg=16):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=r if r2 is None else r2,
                                    depth=d.length, location=(a + b) / 2)
    o = bpy.context.object
    o.name = nombre
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    asignar(o, mat)
    suave(o, 0)
    if padre:
        o.parent = padre
        o.matrix_parent_inverse = padre.matrix_world.inverted()
    return o

def articulacion(nombre, pos, padre=None):
    e = bpy.data.objects.new(nombre, None)
    esc.collection.objects.link(e)
    e.location = pos
    e.empty_display_size = 0.05
    if padre:
        e.parent = padre
        e.matrix_parent_inverse = padre.matrix_world.inverted()
    e.rotation_mode = 'XYZ'
    return e

def clave(o, f, **props):
    for k, v in props.items():
        setattr(o, k, v)
        o.keyframe_insert(k, frame=f)

def suavizar_curvas():
    for a in bpy.data.actions:
        for fc in a.fcurves:
            for k in fc.keyframe_points:
                k.interpolation = 'BEZIER'
                k.easing = 'AUTO'

# ------------------------------------------------------------------ Nubo
# Mira hacia -X local (hacia el perro). Mide ~1,45 m; la cabeza es grande (estilo caricatura).
raiz = articulacion('Nubo', (0, 0, 0))
cadera = articulacion('cadera', (0, 0, 0.62), raiz)
torso = articulacion('torso', (0, 0, 0.62), cadera)

# camiseta: tronco algo cónico + mangas cortas
camisa = cilindro('camiseta', (0, 0, 0.60), (0, 0, 1.0), 0.20, M_CAMISA, torso, r2=0.17, seg=24)
camisa.scale = (1.0, 0.82, 1.0)
bev = camisa.modifiers.new('bisel', 'BEVEL'); bev.width = 0.05; bev.segments = 4
suave(camisa, 2)
cuello = cilindro('cuello', (0, 0, 0.98), (0, 0, 1.06), 0.045, M_EXTREM, torso)
cabeza_art = articulacion('cabeza_art', (0, 0, 1.05), torso)
CAB = Vector((0, 0, 1.36))
cabeza = esfera('cabeza', CAB, (0.34, 0.34, 0.33), M_PIEL, cabeza_art, seg=48)
suave(cabeza, 2)
# cara (hacia -X): ojos grandes, brillos, cejas preocupadas, boca abierta
for lado in (-1, 1):
    ojo = esfera(f'ojo{lado}', CAB + Vector((-0.27, 0.115 * lado, 0.03)), (0.07, 0.065, 0.105), M_OJO, cabeza_art)
    esfera(f'brillo{lado}', CAB + Vector((-0.335, 0.1 * lado + 0.02, 0.085)), (0.016, 0.016, 0.02), M_BRILLO, cabeza_art)
    ceja = cilindro(f'ceja{lado}', CAB + Vector((-0.30, 0.06 * lado, 0.17)), CAB + Vector((-0.285, 0.17 * lado, 0.125)),
                    0.014, M_CEJA, cabeza_art)
    suave(ceja, 1)
boca = esfera('boca', CAB + Vector((-0.295, 0, -0.15)), (0.022, 0.075, 0.06), M_BOCA, cabeza_art)
esfera('lengua', CAB + Vector((-0.305, 0, -0.18)), (0.016, 0.045, 0.02), M_LENGUA, cabeza_art)
# rizo en la coronilla (rasgo propio)
rizo = bpy.data.curves.new('rizo', 'CURVE'); rizo.dimensions = '3D'; rizo.bevel_depth = 0.008
sp = rizo.splines.new('BEZIER'); sp.bezier_points.add(2)
for i, p in enumerate([(0.02, 0, 1.68), (0.06, 0.02, 1.76), (0.0, 0.0, 1.80)]):
    sp.bezier_points[i].co = p; sp.bezier_points[i].handle_left_type = sp.bezier_points[i].handle_right_type = 'AUTO'
o_rizo = bpy.data.objects.new('rizo', rizo); esc.collection.objects.link(o_rizo)
o_rizo.data.materials.append(M_CEJA); o_rizo.parent = cabeza_art
o_rizo.matrix_parent_inverse = cabeza_art.matrix_world.inverted()

def brazo(lado):
    hombro = articulacion(f'hombro{lado}', (0, 0.205 * lado, 0.93), torso)
    manga = cilindro(f'manga{lado}', (0, 0.205 * lado, 0.95), (0, 0.235 * lado, 0.82), 0.075, M_CAMISA, hombro, r2=0.068)
    suave(manga, 1)
    cilindro(f'brazo{lado}', (0, 0.215 * lado, 0.93), (0, 0.235 * lado, 0.68), 0.032, M_EXTREM, hombro)
    codo = articulacion(f'codo{lado}', (0, 0.235 * lado, 0.68), hombro)
    esfera(f'codo_e{lado}', (0, 0.235 * lado, 0.68), (0.033,) * 3, M_EXTREM, codo)
    cilindro(f'antebrazo{lado}', (0, 0.235 * lado, 0.68), (0, 0.24 * lado, 0.47), 0.03, M_EXTREM, codo)
    mano = esfera(f'mano{lado}', (0, 0.24 * lado, 0.43), (0.035, 0.05, 0.06), M_EXTREM, codo)
    for k in range(3):
        cilindro(f'dedo{lado}{k}', (-0.012 + 0.012 * k, 0.24 * lado, 0.40), (-0.016 + 0.016 * k, 0.24 * lado, 0.34),
                 0.011, M_EXTREM, codo)
    cilindro(f'pulgar{lado}', (-0.03, 0.24 * lado, 0.44), (-0.06, 0.24 * lado, 0.40), 0.011, M_EXTREM, codo)
    return hombro, codo

def pierna(lado):
    muslo = articulacion(f'muslo{lado}', (0, 0.085 * lado, 0.64), cadera)
    cilindro(f'pierna{lado}', (0, 0.085 * lado, 0.66), (0, 0.09 * lado, 0.34), 0.038, M_EXTREM, muslo)
    rodilla = articulacion(f'rodilla{lado}', (0, 0.09 * lado, 0.34), muslo)
    esfera(f'rodilla_e{lado}', (0, 0.09 * lado, 0.34), (0.039,) * 3, M_EXTREM, rodilla)
    cilindro(f'espinilla{lado}', (0, 0.09 * lado, 0.34), (0, 0.09 * lado, 0.08), 0.036, M_EXTREM, rodilla)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.05, 0.09 * lado, 0.055))
    z = bpy.context.object; z.name = f'zapa{lado}'; z.scale = (0.25, 0.12, 0.10)
    b = z.modifiers.new('bisel', 'BEVEL'); b.width = 0.045; b.segments = 5
    asignar(z, M_ZAPA); suave(z, 1)
    z.parent = rodilla; z.matrix_parent_inverse = rodilla.matrix_world.inverted()
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.05, 0.09 * lado, 0.012))
    s = bpy.context.object; s.name = f'suela{lado}'; s.scale = (0.26, 0.125, 0.025)
    b = s.modifiers.new('bisel', 'BEVEL'); b.width = 0.01; b.segments = 3
    asignar(s, M_SUELA); s.parent = rodilla; s.matrix_parent_inverse = rodilla.matrix_world.inverted()
    for k in range(3):
        cilindro(f'cordon{lado}{k}', (-0.10 + 0.04 * k, 0.05 * lado + 0.09 * lado - 0.035 * lado, 0.10 + 0.006 * k),
                 (-0.10 + 0.04 * k, 0.09 * lado + 0.035 * lado, 0.10 + 0.006 * k), 0.007, M_CORDON, rodilla)
    return muslo, rodilla

hombro_i, codo_i = brazo(-1)
hombro_d, codo_d = brazo(1)
muslo_i, rod_i = pierna(-1)
muslo_d, rod_d = pierna(1)

# gotas de sudor (se lanzan desde la cabeza)
gotas = []
for k, (y, z) in enumerate([(-0.30, 1.55), (0.28, 1.62), (0.33, 1.42)]):
    g = esfera(f'gota{k}', (-0.05, y, z), (0.035, 0.035, 0.055), M_SUDOR, cabeza_art)
    gotas.append(g)

# ------------------------------------------------------------------ perro callejero
perro = articulacion('Perro', (0, 0, 0))
cuerpo_p = esfera('p_cuerpo', (0, 0, 0.40), (0.34, 0.15, 0.15), M_PERRO, perro)
esfera('p_pecho', (-0.24, 0, 0.42), (0.14, 0.13, 0.15), M_PERRO_CLARO, perro)
cuello_p = articulacion('p_cuello', (-0.30, 0, 0.47), perro)
cab_p = articulacion('p_cabeza', (-0.42, 0, 0.52), cuello_p)
esfera('p_craneo', (-0.42, 0, 0.53), (0.12, 0.11, 0.105), M_PERRO, cab_p)
esfera('p_hocico', (-0.55, 0, 0.495), (0.095, 0.06, 0.055), M_PERRO_CLARO, cab_p)
esfera('p_nariz', (-0.635, 0, 0.515), (0.022, 0.027, 0.02), M_NARIZ, cab_p)
esfera('p_boca', (-0.565, 0, 0.462), (0.07, 0.045, 0.018), M_ENCIA, cab_p)
for lado in (-1, 1):
    esfera(f'p_ojo{lado}', (-0.515, 0.055 * lado, 0.565), (0.016, 0.018, 0.014), M_OJO_PERRO, cab_p)
    cilindro(f'p_ceja{lado}', (-0.52, 0.025 * lado, 0.60), (-0.505, 0.085 * lado, 0.585), 0.012, M_PERRO, cab_p)
    oreja = esfera(f'p_oreja{lado}', (-0.33, 0.10 * lado, 0.63), (0.02, 0.055, 0.085), M_PERRO, cab_p)
    oreja.rotation_euler = (math.radians(-35 * lado), math.radians(30), 0)
    for k in range(2):
        cilindro(f'p_colmillo{lado}{k}', (-0.60 + 0.03 * k, 0.03 * lado, 0.485), (-0.60 + 0.03 * k, 0.03 * lado, 0.452),
                 0.008, M_DIENTE, cab_p, r2=0.001)
patas = []
for i, (x, lado) in enumerate([(-0.22, -1), (-0.22, 1), (0.22, -1), (0.22, 1)]):
    art = articulacion(f'p_pata{i}', (x, 0.085 * lado, 0.38), perro)
    cilindro(f'p_pata_m{i}', (x, 0.085 * lado, 0.40), (x, 0.085 * lado, 0.05), 0.04 if x > 0 else 0.037, M_PERRO, art, r2=0.03)
    esfera(f'p_pie{i}', (x - 0.025, 0.085 * lado, 0.03), (0.045, 0.035, 0.03), M_PERRO_CLARO, art)
    patas.append(art)
cola_art = articulacion('p_cola', (0.32, 0, 0.47), perro)
cola = cilindro('p_cola_m', (0.32, 0, 0.47), (0.46, 0, 0.64), 0.03, M_PERRO, cola_art, r2=0.012)

# ------------------------------------------------------------------ parque
mundo = bpy.data.worlds.new('Cielo'); esc.world = mundo; mundo.use_nodes = True
wn = mundo.node_tree.nodes; wl = mundo.node_tree.links
cielo = wn.new('ShaderNodeTexSky'); cielo.sky_type = 'NISHITA'
cielo.sun_elevation = math.radians(38); cielo.sun_rotation = math.radians(-28); cielo.air_density = 1.2
cielo.dust_density = 0.6
wl.new(cielo.outputs['Color'], wn['Background'].inputs['Color'])
wn['Background'].inputs['Strength'].default_value = 0.35

sol = bpy.data.objects.new('Sol', bpy.data.lights.new('Sol', 'SUN'))
esc.collection.objects.link(sol)
sol.data.energy = 4.2; sol.data.angle = math.radians(2.5); sol.data.color = hexa('#fff1d6')
sol.rotation_euler = (math.radians(50), 0, math.radians(62))
relleno = bpy.data.objects.new('Relleno', bpy.data.lights.new('Relleno', 'AREA'))
esc.collection.objects.link(relleno)
relleno.data.energy = 120; relleno.data.size = 3; relleno.location = (4.0, -1.5, 2.2)
relleno.rotation_euler = (math.radians(65), 0, math.radians(110))

# suelo: hierba con camino de tierra (máscara por la coordenada X del camino)
bpy.ops.mesh.primitive_plane_add(size=80, location=(-20, 0, 0))
suelo = bpy.context.object; suelo.name = 'Suelo'
ms = bpy.data.materials.new('Suelo'); ms.use_nodes = True
nt = ms.node_tree; N = nt.nodes; Lk = nt.links
bsdf = N['Principled BSDF']; bsdf.inputs['Roughness'].default_value = 0.95
tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); Lk.new(tc.outputs['Object'], sep.inputs[0])
# camino: franja |y - curva(x)| < ancho, con borde irregular
ondula = N.new('ShaderNodeTexNoise'); ondula.inputs['Scale'].default_value = 0.6
Lk.new(tc.outputs['Object'], ondula.inputs['Vector'])
def m_(op, a, b):
    n = N.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((a, b)):
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: Lk.new(v, n.inputs[i])
    return n.outputs[0]
desplaz = m_('MULTIPLY', m_('SUBTRACT', ondula.outputs['Fac'], 0.5), 1.2)
dist = m_('ABSOLUTE', m_('SUBTRACT', m_('ADD', sep.outputs['Y'], desplaz), 0.0), 0)
borde = N.new('ShaderNodeTexNoise'); borde.inputs['Scale'].default_value = 9; Lk.new(tc.outputs['Object'], borde.inputs['Vector'])
ancho = m_('ADD', 1.15, m_('MULTIPLY', borde.outputs['Fac'], 0.5))
mascara = m_('LESS_THAN', dist, ancho)
grava = N.new('ShaderNodeTexVoronoi'); grava.inputs['Scale'].default_value = 60
Lk.new(tc.outputs['Object'], grava.inputs['Vector'])
ruido_t = N.new('ShaderNodeTexNoise'); ruido_t.inputs['Scale'].default_value = 14; ruido_t.inputs['Detail'].default_value = 8
Lk.new(tc.outputs['Object'], ruido_t.inputs['Vector'])
tierra = N.new('ShaderNodeMixRGB'); tierra.inputs['Color1'].default_value = (*hexa('#8a7560'), 1)
tierra.inputs['Color2'].default_value = (*hexa('#5d4c3c'), 1); Lk.new(ruido_t.outputs['Fac'], tierra.inputs['Fac'])
piedras = N.new('ShaderNodeMixRGB'); piedras.inputs['Color2'].default_value = (*hexa('#a59a8c'), 1)
Lk.new(tierra.outputs['Color'], piedras.inputs['Color1'])
Lk.new(m_('LESS_THAN', grava.outputs['Distance'], 0.18), piedras.inputs['Fac'])
hierba = N.new('ShaderNodeMixRGB'); hierba.inputs['Color1'].default_value = (*hexa('#4f8a2a'), 1)
hierba.inputs['Color2'].default_value = (*hexa('#2f5d18'), 1); Lk.new(ruido_t.outputs['Fac'], hierba.inputs['Fac'])
final = N.new('ShaderNodeMixRGB'); Lk.new(mascara, final.inputs['Fac'])
Lk.new(hierba.outputs['Color'], final.inputs['Color1']); Lk.new(piedras.outputs['Color'], final.inputs['Color2'])
Lk.new(final.outputs['Color'], bsdf.inputs['Base Color'])
bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.6
Lk.new(ruido_t.outputs['Fac'], bump.inputs['Height']); Lk.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
suelo.data.materials.append(ms)

# hierba 3D en los bordes: matas de hojas finas (instancias compartidas)
m_hierba = con_ruido(principled('Hoja hierba', '#4a8a24', 0.7, **{'Subsurface Weight': 0.2}), '#7ab03a', 3)
def mata():
    import bmesh
    me = bpy.data.meshes.new('mata'); bm = bmesh.new()
    for _ in range(26):
        a = R.uniform(0, math.tau); r = R.uniform(0, 0.12); h = R.uniform(0.12, 0.30); w = 0.012
        base = Vector((math.cos(a) * r, math.sin(a) * r, 0)); inc = Vector((math.cos(a), math.sin(a), 0)) * R.uniform(0.03, 0.10)
        t = Vector((-math.sin(a), math.cos(a), 0)) * w
        v = [bm.verts.new(base - t), bm.verts.new(base + t), bm.verts.new(base + inc * 0.5 + Vector((0, 0, h * 0.6)) + t * 0.6),
             bm.verts.new(base + inc * 0.5 + Vector((0, 0, h * 0.6)) - t * 0.6), bm.verts.new(base + inc + Vector((0, 0, h)))]
        bm.faces.new(v[:4]); bm.faces.new((v[3], v[2], v[4]))
    bm.to_mesh(me); bm.free(); me.materials.append(m_hierba)
    return me
mallas_mata = [mata() for _ in range(3)]
for _ in range(900):
    x = R.uniform(-22, 3.5); y = R.choice((-1, 1)) * R.uniform(1.25, 7)
    if x > -1 and abs(y) < 2.2 and R.random() < 0.6:
        continue
    o = bpy.data.objects.new('mata', R.choice(mallas_mata)); esc.collection.objects.link(o)
    o.location = (x, y, 0); o.rotation_euler = (0, 0, R.uniform(0, math.tau)); s = R.uniform(0.7, 1.4); o.scale = (s, s, s)

# árboles: tronco + copas de "nubes" desplazadas (prototipos compartidos)
m_tronco = con_ruido(principled('Tronco', '#4a3a2c', 0.9), '#2e241b', 30, 0.5)
hojas = [con_ruido(principled(f'Copa{i}', c, 0.75, **{'Subsurface Weight': 0.25}), c2, 4, 0.3)
         for i, (c, c2) in enumerate([('#3f7f22', '#6aa83a'), ('#2f6a1d', '#5c9a32'), ('#4d8c2a', '#86b84a')])]
tex = bpy.data.textures.new('nubes_copa', 'CLOUDS'); tex.noise_scale = 0.35
def copa(nombre, mat):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1)
    o = bpy.context.object; o.name = nombre
    d = o.modifiers.new('desp', 'DISPLACE'); d.texture = tex; d.strength = 0.45
    asignar(o, mat); suave(o, 0)
    me = o.data
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.object
    me = o.data
    bpy.data.objects.remove(o, do_unlink=True)
    return me
copas = [copa(f'copa{i}', hojas[i % 3]) for i in range(4)]
tronco_me = None
def arbol(x, y, alto):
    global tronco_me
    t = cilindro('tronco', (x, y, 0), (x + R.uniform(-0.2, 0.2), y + R.uniform(-0.2, 0.2), alto), 0.22, m_tronco, r2=0.12)
    for _ in range(R.randint(3, 5)):
        c = bpy.data.objects.new('copa', R.choice(copas)); esc.collection.objects.link(c)
        r = R.uniform(1.3, 2.2)
        c.location = (x + R.uniform(-1, 1), y + R.uniform(-1, 1), alto + R.uniform(-0.6, 1.2)); c.scale = (r, r, r * 0.85)
        c.rotation_euler = (R.uniform(0, 3), R.uniform(0, 3), R.uniform(0, 3))
for k in range(16):
    for lado in (-1, 1):
        x = 2.5 - k * 2.6 + R.uniform(-0.6, 0.6)
        y = lado * (3.2 + R.uniform(0, 2.5)) + (0.8 * math.sin(k * 0.5) if k > 4 else 0)
        arbol(x, y, R.uniform(4.0, 6.5))
# arbustos bajos a los lados
for _ in range(40):
    x = R.uniform(-30, 2); y = R.choice((-1, 1)) * R.uniform(2.3, 4.5)
    c = bpy.data.objects.new('arbusto', R.choice(copas)); esc.collection.objects.link(c)
    r = R.uniform(0.45, 0.9); c.location = (x, y, r * 0.5); c.scale = (r, r, r * 0.7)

# ------------------------------------------------------------------ colocación y animación
# camino hacia -X (al fondo). Nubo a la derecha del encuadre, el perro a la izquierda en primer plano.
raiz.location = (0.0, 0.55, 0); raiz.rotation_euler = (0, 0, math.radians(128))   # mira hacia el perro
perro.location = (0.15, -0.95, 0); perro.rotation_euler = (0, 0, math.radians(-100))

def pose(f, inclin=0.0, br_i=(0, 0, 0), co_i=0.0, br_d=(0, 0, 0), co_d=0.0, cab=(0, 0, 0)):
    clave(torso, f, rotation_euler=(0, inclin, 0))
    clave(hombro_i, f, rotation_euler=br_i); clave(codo_i, f, rotation_euler=(0, co_i, 0))
    clave(hombro_d, f, rotation_euler=br_d); clave(codo_d, f, rotation_euler=(0, co_d, 0))
    clave(cabeza_art, f, rotation_euler=cab)

r = math.radians
# 1-24: Nubo camina tranquilo (balanceo); 30: se frena; 34-44: se echa atrás y levanta la mano
for f in range(1, 31, 6):
    fase = (f - 1) / 12 * math.pi
    clave(raiz, f, location=(0.0 - (31 - f) * 0.012, 0.55, abs(math.sin(fase)) * 0.025))
    clave(muslo_i, f, rotation_euler=(0, math.sin(fase) * r(18), 0))
    clave(muslo_d, f, rotation_euler=(0, -math.sin(fase) * r(18), 0))
    clave(hombro_i, f, rotation_euler=(0, -math.sin(fase) * r(15), 0))
    clave(hombro_d, f, rotation_euler=(0, math.sin(fase) * r(15), 0))
clave(muslo_i, 36, rotation_euler=(0, r(-6), 0)); clave(muslo_d, 36, rotation_euler=(0, r(10), 0))
clave(raiz, 36, location=(0.05, 0.55, 0))
pose(30, 0, (0, 0, 0), 0, (0, 0, 0), 0, (0, 0, 0))
pose(40, r(-10), (r(-8), r(30), 0), r(55), (r(10), r(72), 0), r(88), (0, r(-8), r(6)))
pose(48, r(-13), (r(-10), r(34), 0), r(62), (r(12), r(78), 0), r(92), (0, r(-10), r(4)))
# temblor de miedo
for f in range(50, FIN + 1, 3):
    t = (f - 50) / 3
    clave(torso, f, rotation_euler=(r(1.2) * math.sin(t * 2.1), r(-12) + r(1.0) * math.sin(t * 1.7), 0))
    clave(cabeza_art, f, rotation_euler=(r(1.5) * math.sin(t * 2.6), r(-9), r(4) + r(2) * math.sin(t)))
# gotas de sudor: aparecen a los 38 y salen despedidas
for k, g in enumerate(gotas):
    p0 = g.location.copy()
    clave(g, 1, scale=(0, 0, 0)); clave(g, 37 + k * 2, scale=(0, 0, 0))
    clave(g, 41 + k * 2, scale=(0.035, 0.035, 0.055), location=p0)
    clave(g, 78 + k * 4, location=p0 + Vector((0.02, 0.10 * (1 if p0.y > 0 else -1), -0.12)), scale=(0.032, 0.032, 0.05))
    clave(g, 92 + k * 4, scale=(0, 0, 0), location=p0 + Vector((0.03, 0.14 * (1 if p0.y > 0 else -1), -0.30)))
# perro: postura baja y tensa, gruñe (sacudidas de cabeza) y avanza dos pasos
clave(perro, 1, location=(1.10, -0.62, 0))
clave(perro, 40, location=(1.10, -0.62, 0))
clave(perro, 70, location=(0.95, -0.45, 0))
clave(perro, 100, location=(0.82, -0.32, 0))
clave(perro, 170, location=(0.70, -0.22, 0))
clave(cuerpo_p, 1, rotation_euler=(0, r(4), 0))
for f in range(1, FIN + 1, 4):
    t = f / 4
    clave(cab_p, f, rotation_euler=(r(2) * math.sin(t * 1.9), r(6) + r(2.5) * math.sin(t * 2.7), r(3) * math.sin(t * 1.3)))
    clave(cola_art, f, rotation_euler=(r(4) * math.sin(t), r(25), 0))
for i, p in enumerate(patas):
    desf = 0 if i in (0, 3) else 1
    for f in range(40, 177, 8):
        fase = ((f - 40) / 8 + desf) % 2
        clave(p, f, rotation_euler=(0, r(14) if fase < 1 else r(-10), 0))
    clave(p, 184, rotation_euler=(0, 0, 0))
clave(cuello_p, 1, rotation_euler=(0, r(8), 0))
suavizar_curvas()

# ------------------------------------------------------------------ cámara
cam = bpy.data.objects.new('Camara', bpy.data.cameras.new('Camara')); esc.collection.objects.link(cam)
esc.camera = cam
cam.data.lens = 28; cam.data.sensor_width = 36
cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 2.8
foco = articulacion('foco', (0.45, 0.05, 0.78)); cam.data.dof.focus_object = foco
mira = cam.constraints.new('TRACK_TO'); mira.target = foco; mira.track_axis = 'TRACK_NEGATIVE_Z'; mira.up_axis = 'UP_Y'
clave(cam, INICIO, location=(2.55, -0.02, 0.74))
clave(cam, FIN, location=(2.25, -0.02, 0.76))
for fc in cam.animation_data.action.fcurves:
    for k in fc.keyframe_points:
        k.interpolation = 'LINEAR'

# ------------------------------------------------------------------ render
esc.render.engine = 'CYCLES'
c = esc.cycles
c.device = 'CPU'; c.samples = MUESTRAS; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.05
c.use_denoising = False
c.max_bounces = 4; c.diffuse_bounces = 2; c.glossy_bounces = 2; c.transmission_bounces = 4; c.transparent_max_bounces = 4
c.caustics_reflective = c.caustics_refractive = False
c.blur_glossy = 1.0
esc.render.resolution_x, esc.render.resolution_y = 1080, 1920
esc.render.resolution_percentage = ESCALA
esc.view_settings.view_transform = 'AgX'
esc.view_settings.look = 'AgX - Medium High Contrast'
esc.render.image_settings.file_format = 'PNG'
os.makedirs(SALIDA, exist_ok=True)

fotogramas = SOLO or list(range(INICIO, FIN + 1))
for f in fotogramas:
    esc.frame_set(f)
    esc.render.filepath = os.path.join(SALIDA, f'f{f:04d}.png')
    bpy.ops.render.render(write_still=True)
    print(f'RENDER {f}/{fotogramas[-1]}', flush=True)
