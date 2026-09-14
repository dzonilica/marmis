# Pravi web verziju 3D haljine sa lutkom za sekciju "Svaki sav tacno na svom
# mestu" (DressDiscover) na pocetnoj.
#
#   "E:\blender\blender.exe" -b --factory-startup --python marmis/_alati/haljina-za-web.py
#
# Ulaz:  haljina_sa_lutkom/haljina_sa_lutkom.glb (+ uniformNormal.png)
# Izlaz: webgl/haljina-lutka/haljina-lutka.glb, -normal.jpg, -occlusion.jpg
#
# Scena sajta (DressDiscoverScene) uzima JEDAN mesh (scene[0].children[0]) sa
# POSITION/NORMAL/TEXCOORD_0, crta ga jednim materijalom (svetlosiva boja +
# normal mapa + occlusion mapa, samo prednje strane) i skalira ga po visini.
# Zato se haljina, lutka i sipka spajaju u jedan mesh, sa jednim UV rasporedom
# bez preklapanja, a normal i AO se peku u dve mape.
import bpy, bmesh, math, os, sys
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.environ.get('MARMIS_ROOT') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0]) if argv else os.path.join(ROOT, 'webgl', 'haljina-lutka')
SRC = os.path.join(ROOT, 'haljina_sa_lutkom')

DRESS_TRIS = 86000       # haljina ima 311k; ukupno mora ostati < 65536 temena (16-bitni indeksi)
LOWER_Z = 0.75           # m iznad poruba; ispod ovoga se suknja na sajtu rastapa u pozadinu
LOWER_TRIS = 18000       # ...pa donji deo prvo sam ide na ovoliko (od 83k), ostatak ide gornjem
MANNEQUIN_TRIS = 10000   # lutka ima 25k
SIZE = 2048              # mape, kao kod stare haljine
SHARP_DEG = 60           # ivice debljine tkanine (~90 st.) su ostre, nabori nisu
NORMAL_STRENGTH = 0.65   # iz materijala originalnog GLB-a
AO_DISTANCE = 0.35       # m

os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def log(*a):
    print('[haljina]', *a, flush=True)


def activate(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


# --- uvoz --------------------------------------------------------------------
bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, 'haljina_sa_lutkom.glb'))
by = lambda prefix: next(o for o in scene.objects if o.name.startswith(prefix))
dress = by('Dress')
mannequin = by('Mannequin')
rod = by('Stand — slim')
bpy.data.objects.remove(by('Stand — hidden'))   # nosac u torzu, nikad se ne vidi

for o in (dress, mannequin, rod):
    activate([o])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if o.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()

# originalni UV haljine ostaje kao 'orig' (po njemu se cita originalna normal
# mapa); novi raspored ide u 'UVMap'
for o in (dress, rod):
    o.data.uv_layers[0].name = 'orig'
mannequin.data.uv_layers.new(name='orig')


# --- smanjenje mreze -----------------------------------------------------------
def decimate(o, target, group=None):
    ratio = min(1.0, target / tris(o))
    if ratio >= 1.0:
        return
    activate([o])
    m = o.modifiers.new('dec', 'DECIMATE')
    m.decimate_type = 'COLLAPSE'
    m.ratio = ratio
    m.use_collapse_triangulate = True
    if group:   # temena van grupe se ne diraju (tezine se ponasaju binarno)
        m.vertex_group = group
        m.vertex_group_factor = 1.0
    bpy.ops.object.modifier_apply(modifier=m.name)


def tris_split(o):
    """(trouglovi ispod LOWER_Z iznad poruba, trouglovi iznad)"""
    vs = o.data.vertices
    z0 = min(v.co.z for v in vs)
    lo = sum(len(p.vertices) - 2 for p in o.data.polygons
             if sum(vs[i].co.z for i in p.vertices) / len(p.vertices) - z0 < LOWER_Z)
    return lo, tris(o) - lo


# Kamera na sajtu prelazi odozgo nadole, a donji deo suknje se rastapa u
# pozadinu; ravnomerno smanjenje bi bas gornji deo (gust: steznik, pojas,
# masna) najvise stanjilo. Zato prvo sam donji deo ide na LOWER_TRIS, pa cela
# haljina ravnomerno na DRESS_TRIS.
lo, hi = tris_split(dress)
log('trouglovi pre', tris(dress), tris(mannequin), tris(rod), 'haljina ispod/iznad', LOWER_Z, 'm:', (lo, hi))
z0 = min(v.co.z for v in dress.data.vertices)
vg = dress.vertex_groups.new(name='donji')
vg.add([v.index for v in dress.data.vertices if v.co.z - z0 < LOWER_Z], 1.0, 'REPLACE')
decimate(dress, hi + LOWER_TRIS, group=vg.name)
dress.vertex_groups.clear()
decimate(dress, DRESS_TRIS)
decimate(mannequin, MANNEQUIN_TRIS)
log('trouglovi posle', tris(dress), tris(mannequin), tris(rod), 'haljina ispod/iznad', LOWER_Z, 'm:', tris_split(dress))

for o in (dress, mannequin, rod):
    o.data.uv_layers.new(name='UVMap', do_init=True)   # kopija 'orig'
    o.data.uv_layers.active = o.data.uv_layers['UVMap']

# lutka nema UV: pravi se na njenom 'UVMap'
activate([mannequin])
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0)
bpy.ops.object.mode_set(mode='OBJECT')

# --- centriranje -------------------------------------------------------------
# osa sipke = osa okretanja na sajtu; y=0 (glTF) = najnizi porub haljine, pa
# sajt skalira po visini porub->vrat, a sipka ide ispod nule
rb = [rod.matrix_world @ Vector(c) for c in rod.bound_box]
axis_x = sum(p.x for p in rb) / 8
axis_y = sum(p.y for p in rb) / 8
hem_z = min(v.co.z for v in dress.data.vertices)
shift = Vector((-axis_x, -axis_y, -hem_z))
for o in (dress, mannequin, rod):
    o.data.transform(Matrix.Translation(shift))
    o.data.update()
log('pomeraj', tuple(round(c, 4) for c in shift))

# --- spajanje ----------------------------------------------------------------
activate([dress, mannequin, rod])
bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
obj.name = 'HaljinaLutka'
me = obj.data
me.uv_layers.active = me.uv_layers['UVMap']
me.uv_layers['UVMap'].active_render = True
log('uv slojevi', [l.name for l in me.uv_layers], 'materijali', [m.name for m in me.materials])

# ostre ivice po uglu (za normale na sajtu i za razdvajanje UV ostrva)
activate([obj])
bpy.ops.object.shade_smooth_by_angle(angle=math.radians(SHARP_DEG), keep_sharp_edges=False)


# --- UV raspored bez preklapanja ---------------------------------------------
# Spoljni i unutrasnji sloj tkanine dele isti UV (preklapaju se), a spojeni su
# ivicom debljine. Lica se grupisu u oblasti koje ne prelaze preko UV sava ni
# preko ostre ivice; svaka oblast se pomeri daleko, da postane zasebno ostrvo,
# pa pack_islands sve slozi u 0..1 bez preklapanja.
def split_regions():
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv['UVMap']
    cos_sharp = math.cos(math.radians(SHARP_DEG))
    bm.faces.ensure_lookup_table()

    def joined(l):
        o = l.link_loop_radial_next
        if o is l or o.link_loop_radial_next is not l:   # granica ili ne-mnogostruko
            return False
        if l.face.normal.dot(o.face.normal) < cos_sharp:
            return False
        a0, a1 = l[uv].uv, l.link_loop_next[uv].uv
        if o.vert is l.vert:
            b0, b1 = o[uv].uv, o.link_loop_next[uv].uv
        else:
            b0, b1 = o.link_loop_next[uv].uv, o[uv].uv
        return (a0 - b0).length < 1e-6 and (a1 - b1).length < 1e-6

    region = [-1] * len(bm.faces)
    n = 0
    for f in bm.faces:
        if region[f.index] >= 0:
            continue
        region[f.index] = n
        stack = [f]
        while stack:
            g = stack.pop()
            for l in g.loops:
                if joined(l):
                    h = l.link_loop_radial_next.face
                    if region[h.index] < 0:
                        region[h.index] = n
                        stack.append(h)
        n += 1
    for f in bm.faces:
        r = region[f.index]
        d = Vector(((r % 128) * 2.0, (r // 128) * 2.0))
        for l in f.loops:
            l[uv].uv += d
    bm.to_mesh(me)
    bm.free()
    return n


log('UV oblasti', split_regions())

bpy.context.scene.tool_settings.use_uv_select_sync = True
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.select_all(action='SELECT')
bpy.ops.uv.average_islands_scale()
bpy.ops.uv.pack_islands(rotate=True, margin_method='FRACTION', margin=0.003, shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')


def coverage(meshes, N):
    """koliko trouglova (po 'UVMap') pokriva centar svakog teksela; red 0 = v=0"""
    cnt = np.zeros((N, N), np.uint8)
    for m in meshes:
        uvd = m.uv_layers['UVMap'].data
        m.calc_loop_triangles()
        for lt in m.loop_triangles:
            a, b, c = (uvd[i].uv for i in lt.loops)
            den = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
            if abs(den) < 1e-14:
                continue
            x0, x1 = max(0, int(min(a.x, b.x, c.x) * N)), min(N - 1, int(max(a.x, b.x, c.x) * N))
            y0, y1 = max(0, int(min(a.y, b.y, c.y) * N)), min(N - 1, int(max(a.y, b.y, c.y) * N))
            if x1 < x0 or y1 < y0:
                continue
            X, Y = np.meshgrid((np.arange(x0, x1 + 1) + .5) / N, (np.arange(y0, y1 + 1) + .5) / N)
            w1 = ((b.y - c.y) * (X - c.x) + (c.x - b.x) * (Y - c.y)) / den
            w2 = ((c.y - a.y) * (X - c.x) + (a.x - c.x) * (Y - c.y)) / den
            cnt[y0:y1 + 1, x0:x1 + 1] += (w1 >= 0) & (w2 >= 0) & (w1 + w2 <= 1)
    return cnt


cnt = coverage([me], 1024)
log(f'UV pokrivenost {np.mean(cnt > 0)*100:.1f}%, preklapanje {np.sum(cnt > 1)/max(np.sum(cnt > 0), 1)*100:.2f}%')


# --- pecenje -----------------------------------------------------------------
def use_gpu():
    try:
        cp = bpy.context.preferences.addons['cycles'].preferences
        for kind in ('OPTIX', 'CUDA'):
            try:
                cp.compute_device_type = kind
            except TypeError:
                continue
            cp.get_devices()
            gpus = [d for d in cp.devices if d.type == kind]
            if gpus:
                for d in cp.devices:
                    d.use = d.type == kind
                scene.cycles.device = 'GPU'
                return kind + ': ' + ', '.join(d.name for d in gpus)
    except Exception as e:
        return 'CPU (' + str(e) + ')'
    return 'CPU'


scene.render.engine = 'CYCLES'
log('uredjaj', use_gpu())
scene.world = bpy.data.worlds.new('w')
scene.world.light_settings.distance = AO_DISTANCE
scene.render.bake.margin = 8
scene.render.bake.margin_type = 'EXTEND'
scene.render.bake.use_selected_to_active = False
scene.render.bake.use_clear = True


def new_image(name, color):
    img = bpy.data.images.new(name, SIZE, SIZE, alpha=False, float_buffer=False)
    img.colorspace_settings.name = 'Non-Color'
    img.generated_color = color
    return img


src_normal = bpy.data.images.load(os.path.join(SRC, 'uniformNormal.png'))
src_normal.colorspace_settings.name = 'Non-Color'

targets = []
for mat in me.materials:
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    if mat.name.startswith('Ivory'):   # haljina: originalna normal mapa po 'orig' UV-u
        uvn = nt.nodes.new('ShaderNodeUVMap')
        uvn.uv_map = 'orig'
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = src_normal
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.space = 'TANGENT'
        nm.uv_map = 'orig'
        nm.inputs['Strength'].default_value = NORMAL_STRENGTH
        nt.links.new(uvn.outputs['UV'], tex.inputs['Vector'])
        nt.links.new(tex.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    t = nt.nodes.new('ShaderNodeTexImage')
    uvt = nt.nodes.new('ShaderNodeUVMap')
    uvt.uv_map = 'UVMap'
    nt.links.new(uvt.outputs['UV'], t.inputs['Vector'])
    for nd in nt.nodes:
        nd.select = False
    t.select = True
    nt.nodes.active = t
    targets.append(t)


def bake(kind, img, samples, objs, **kw):
    for t in targets:
        t.image = img
    scene.cycles.samples = samples
    activate(objs)
    bpy.ops.object.bake(type=kind, margin=8, use_clear=True, **kw)
    log('ispeceno', kind, [o.name for o in objs])


def pixels(img):
    buf = np.empty(SIZE * SIZE * 4, np.float32)
    img.pixels.foreach_get(buf)
    return buf.reshape(SIZE, SIZE, 4)


# Vrh masne i delovi steznika malo ulaze u lutku (lutka je dodata posle
# simulacije haljine); u AO-u sa lutkom ti vrhovi ispadnu crni i na sajtu se
# vide kao tacke. Zato se AO haljine pece bez lutke, AO lutke i sipke sa svim,
# pa se spoje po UV ostrvima.
activate([obj])
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='MATERIAL')
bpy.ops.object.mode_set(mode='OBJECT')
parts = {o.data.materials[o.data.polygons[0].material_index].name.split()[0]: o
         for o in scene.objects if o.type == 'MESH'}
p_dress, p_mann, p_rod = parts['Ivory'], parts['Mannequin'], parts['Stand']

ao_all = new_image('ao_all', (1, 1, 1, 1))
bake('AO', ao_all, 256, [p_dress, p_mann, p_rod])
p_mann.hide_render = True
ao_dress = new_image('ao_dress', (1, 1, 1, 1))
bake('AO', ao_dress, 256, [p_dress])
p_mann.hide_render = False
nrm = new_image('nrm', (0.5, 0.5, 1, 1))
bake('NORMAL', nrm, 16, [p_dress, p_mann, p_rod], normal_space='TANGENT')

# ostrvo po tekselu (1 haljina, 2 lutka/sipka), pa se oznake prosire u margine
lab = (coverage([p_dress.data], SIZE) > 0).astype(np.uint8)
lab[coverage([p_mann.data, p_rod.data], SIZE) > 0] = 2
for _ in range(16):
    grown = np.maximum.reduce([np.roll(lab, s, a) for s in (1, -1) for a in (0, 1)])
    lab = np.where(lab == 0, grown, lab)
A, B = pixels(ao_all), pixels(ao_dress)
ao = new_image('ao', (1, 1, 1, 1))
ao.pixels.foreach_set(np.where((lab == 2)[..., None], A, B).ravel())
ao.update()
changed = np.abs(A[..., 0] - B[..., 0])[lab == 1] > 0.1
log(f'AO haljine bez lutke: promenjeno {changed.mean()*100:.2f}% teksela haljine')


def save_jpg(img, path):
    img.filepath_raw = path
    img.file_format = 'JPEG'
    try:
        img.save(filepath=path, quality=92)
    except TypeError:
        img.save()
    log('snimljeno', path, os.path.getsize(path))


save_jpg(nrm, os.path.join(OUT, 'haljina-lutka-normal.jpg'))
save_jpg(ao, os.path.join(OUT, 'haljina-lutka-occlusion.jpg'))

# --- izvoz -------------------------------------------------------------------
activate([p_dress, p_mann, p_rod])
bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
obj.name = 'HaljinaLutka'
me = obj.data
me.uv_layers.remove(me.uv_layers['orig'])
me.materials.clear()
activate([obj])
glb = os.path.join(OUT, 'haljina-lutka.glb')
bpy.ops.export_scene.gltf(
    filepath=glb, export_format='GLB', use_selection=True,
    export_materials='NONE', export_texcoords=True, export_normals=True,
    export_tangents=False, export_yup=True, export_apply=True,
    export_animations=False, export_skins=False, export_morph=False,
    export_cameras=False, export_lights=False, export_extras=False,
)
log('snimljeno', glb, os.path.getsize(glb))

# provera: jedan cvor, jedan primitiv, samo POSITION/NORMAL/TEXCOORD_0
import json, struct
with open(glb, 'rb') as f:
    data = f.read()
j = json.loads(data[20:20 + struct.unpack('<I', data[12:16])[0]])
prims = [p for m in j['meshes'] for p in m['primitives']]
assert len(j['scenes'][0]['nodes']) == 1 and len(prims) == 1, 'ocekuje se jedan mesh sa jednim primitivom'
assert sorted(prims[0]['attributes']) == ['NORMAL', 'POSITION', 'TEXCOORD_0'], prims[0]['attributes']
acc = j['accessors']
pos = acc[prims[0]['attributes']['POSITION']]
idx = acc[prims[0]['indices']]
log('temena', pos['count'], 'trouglova', idx['count'] // 3,
    'indeksi', {5123: 'uint16', 5125: 'uint32'}[idx['componentType']],
    'min', [round(c, 4) for c in pos['min']], 'max', [round(c, 4) for c in pos['max']])
