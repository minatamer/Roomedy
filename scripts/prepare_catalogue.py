"""Offline, selected-file-only preparation. Usage: python scripts/prepare_catalogue.py source.zip.

Source archive is reviewed separately and never published. Actual catalogue/part/palette
definitions are read through their local public exports, not retyped here.
"""
from pathlib import Path
import hashlib
import json
import struct
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'apps/frontend/public/catalogue'
ARCHIVE_SHA = 'e67652d0932cee41683f74711c03d3e192a2af9979ef8e6b237711f5482d46b0'
SOURCE_URL = 'https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip'
SELECTION = {'chair-desk': 'chairDesk.glb', 'bedside-storage': 'cabinetBed.glb'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load_glb(data):
    magic, version, total = struct.unpack_from('<III', data)
    assert magic == 0x46546c67 and version == 2 and total == len(data)
    length, kind = struct.unpack_from('<II', data, 12)
    assert kind == 0x4e4f534a
    document = json.loads(data[20:20+length])
    binary_start = 20 + length
    binary_length, binary_kind = struct.unpack_from('<II', data, binary_start)
    assert binary_kind == 0x004e4942
    return document, data[binary_start+8:binary_start+8+binary_length]


def geometry(document, binary):
    faces, points = [], []

    def accessor(index):
        a = document['accessors'][index]
        v = document['bufferViews'][a['bufferView']]
        offset = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        components = 3 if a['type'] == 'VEC3' else 1
        code = {5126: 'f', 5125: 'I', 5123: 'H', 5121: 'B'}[a['componentType']]
        stride = v.get('byteStride', struct.calcsize('<' + code * components))
        return [struct.unpack_from('<' + code * components, binary, offset + i*stride) for i in range(a['count'])]

    def visit(index, translation=(0, 0, 0), scale=1):
        node = document['nodes'][index]
        assert node.get('rotation', [0, 0, 0, 1]) == [0, 0, 0, 1], 'Review new source rotations explicitly'
        s = node.get('scale', [1, 1, 1])
        assert s[0] == s[1] == s[2], 'Nonuniform source scaling is unsupported'
        t = tuple(translation[i] + node.get('translation', [0, 0, 0])[i]*scale for i in range(3))
        scale *= s[0]
        if 'mesh' in node:
            for primitive in document['meshes'][node['mesh']]['primitives']:
                assert primitive.get('mode', 4) == 4
                vertices = [tuple(p[i]*scale+t[i] for i in range(3)) for p in accessor(primitive['attributes']['POSITION'])]
                points.extend(vertices)
                indices = [i[0] for i in accessor(primitive['indices'])]
                for start in range(0, len(indices), 3):
                    faces.append(([vertices[indices[start+i]] for i in range(3)], primitive.get('material', 0)))
        for child in node.get('children', []):
            visit(child, t, scale)

    for index in document['scenes'][document.get('scene', 0)]['nodes']:
        visit(index)
    bounds = {'min': [min(p[i] for p in points) for i in range(3)], 'max': [max(p[i] for p in points) for i in range(3)]}
    return faces, bounds, len(points)


def glb_bytes(document, binary):
    encoded = json.dumps(document, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary += b'\0' * (-len(binary) % 4)
    size = 12 + 8 + len(encoded) + 8 + len(binary)
    return struct.pack('<III', 0x46546c67, 2, size) + struct.pack('<II', len(encoded), 0x4e4f534a) + encoded + struct.pack('<II', len(binary), 0x004e4942) + binary


def linear_color(hex_color):
    values = [int(hex_color[i:i+2], 16)/255 for i in (1, 3, 5)]
    return [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in values] + [1]


def thumbnail(faces, colors, label, size):
    projected = [[((x-z)*.8660254, (x+z)*.5-y) for x, y, z in face] for face, _ in faces]
    all_points = [p for face in projected for p in face]
    low = [min(p[i] for p in all_points) for i in range(2)]
    high = [max(p[i] for p in all_points) for i in range(2)]
    scale = min(108/(high[0]-low[0]), 83/(high[1]-low[1]))
    ordered = sorted(zip(faces, projected), key=lambda item: min(p[0]+p[1]+p[2] for p in item[0][0]))
    paths = []
    for ((face, material), points) in ordered:
        coords = ' '.join(f'{(x-(low[0]+high[0])/2)*scale+64:.2f},{(y-low[1])*scale+8:.2f}' for x, y in points)
        paths.append(f'<polygon points="{coords}" fill="{colors[material]}" stroke="#29483f" stroke-opacity=".12" stroke-width=".35" stroke-linejoin="round"/>')
    title = f'{label}: {size["width"]} by {size["depth"]} by {size["height"]} mm. Similar representation.'
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 112" role="img"><title>'+title+'</title><rect width="128" height="112" rx="18" fill="#f3eee2"/><ellipse cx="64" cy="94" rx="39" ry="6" fill="#143e36" opacity=".09"/>'+''.join(paths)+'</svg>\n'


def box_faces(parts, palette):
    faces = []
    for part in parts:
        x, y, z = part['center']; w, h, d = part['size']
        vertices = [(x+sx*w/2, y+sy*h/2, z+sz*d/2) for sx, sy, sz in [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]]
        material = {'frame': 0, 'soft': 1, 'metal': 2}[part['role']]
        for indices in [(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7),(0,3,2,1)]:
            faces.append(([vertices[i] for i in indices], material))
    return faces, [palette['oak'], palette['ivory'], palette['charcoal']]


def main():
    archive = Path(sys.argv[1])
    assert archive.stat().st_size < 60*1024*1024
    assert digest(archive.read_bytes()) == ARCHIVE_SHA, 'Source archive differs from reviewed artifact'
    query = "import { CATALOGUE } from '@roomedy/spatial'; import { FINISH_PALETTE } from './apps/frontend/src/features/catalogue/finishes.ts'; import { proceduralParts } from './apps/frontend/src/features/room-view/representations/definitions.ts'; console.log(JSON.stringify({catalogue:CATALOGUE,palette:FINISH_PALETTE,parts:Object.fromEntries(CATALOGUE.map(e=>[e.assetId,proceduralParts(e.category,Object.fromEntries(Object.entries(e.size).map(([k,a])=>[k,a.default])),e.accessMechanism)]))}));"
    data = json.loads(subprocess.run(['node', '--import', 'tsx', '--input-type=module', '-e', query], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    OUT.mkdir(parents=True, exist_ok=True); (OUT/'thumbnails').mkdir(exist_ok=True)
    manifest = {'version': 1, 'source': {'url': SOURCE_URL, 'page': 'https://kenney.nl/assets/furniture-kit', 'author': 'Kenney', 'archiveFilename': archive.name, 'archiveSha256': ARCHIVE_SHA, 'archiveVersion': 'Furniture Kit 2.0 (included license)', 'license': 'CC0-1.0', 'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/', 'attributionRequired': False}, 'budgets': {'assetBytes': 262144, 'triangles': 10000, 'materials': 8, 'textures': 0}, 'assets': [], 'thumbnails': []}
    with zipfile.ZipFile(archive) as source:
        license_bytes = source.read('License.txt')
        (OUT/'LICENSE-Kenney.txt').write_bytes(license_bytes)
        manifest['source']['licenseSha256'] = digest(license_bytes)
        for entry in data['catalogue']:
            size = {key: axis['default'] for key, axis in entry['size'].items()}
            if entry['assetId'] in SELECTION:
                original = 'Models/GLTF format/' + SELECTION[entry['assetId']]
                raw = source.read(original); document, binary = load_glb(raw)
                assert not document.get('images') and all('uri' not in b for b in document.get('buffers', []))
                _, bounds, _ = geometry(document, binary)
                translation = [-(bounds['min'][i]+bounds['max'][i]) if i != 1 else -bounds['min'][i]*2 for i in range(3)]
                roots = document['scenes'][document.get('scene', 0)]['nodes']
                document['nodes'].append({'name': 'roomedy-semantic-center-floor', 'children': roots, 'scale': [2,2,2], 'translation': translation})
                document['scenes'][document.get('scene', 0)]['nodes'] = [len(document['nodes'])-1]
                colors = [data['palette']['oak'], data['palette']['charcoal']] if entry['assetId'] == 'bedside-storage' else [data['palette']['charcoal'], data['palette']['clay']]
                for material, color in zip(document['materials'], colors): material['pbrMetallicRoughness']['baseColorFactor'] = linear_color(color)
                prepared = glb_bytes(document, binary)
                name = entry['assetId'] + '-v1.glb'; (OUT/name).write_bytes(prepared)
                faces, bounds, vertices = geometry(document, binary)
                assert len(prepared) <= 262144 and len(faces) <= 10000 and len(document['materials']) <= 8
                manifest['assets'].append({'catalogueId': entry['id'], 'sourceFilename': original, 'sourceSha256': digest(raw), 'preparedFilename': name, 'sha256': digest(prepared), 'bytes': len(prepared), 'triangles': len(faces), 'vertices': vertices, 'materials': len(document['materials']), 'textures': 0, 'boundsMetres': bounds, 'semanticMm': size, 'sourceToPrepared': {'uniformScale': 2, 'translationMetres': translation, 'rotationQuarterTurns': 0}, 'front': 'positive-z', 'origin': 'floor-footprint-center', 'runtimeScale': 1, 'notes': 'Static reviewed variant, uniform scale and palette remap; no runtime stretching.'})
            else:
                faces, colors = box_faces(data['parts'][entry['assetId']], data['palette'])
            svg = thumbnail(faces, colors, entry['label'], size).encode()
            filename = 'thumbnails/' + entry['assetId'] + '.svg'; (OUT/filename).write_bytes(svg)
            manifest['thumbnails'].append({'catalogueId': entry['id'], 'filename': filename, 'bytes': len(svg), 'sha256': digest(svg), 'semanticMm': size})
    (OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(json.dumps({'assets':len(manifest['assets']), 'thumbnails':len(manifest['thumbnails']), 'preparedBytes':sum(a['bytes'] for a in manifest['assets'])}))


if __name__ == '__main__':
    main()
