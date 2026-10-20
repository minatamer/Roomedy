import {
  Color,
  DataTexture,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { Group, Texture } from 'three';
import type { RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { buildDesignScene, loadDesignAssets } from './scene';
import { DesignExportError, withExportSignal } from './facts';
const encoder = new TextEncoder();
const number = (value: number) => {
  if (!Number.isFinite(value)) throw new DesignExportError('failed');
  return String(Math.round(value * 1_000_000) / 1_000_000);
};
async function texturePng(map: Texture, signal: AbortSignal) {
  const image = map.image as {
    width: number;
    height: number;
    data?: Uint8Array;
  };
  if (
    !image ||
    !(image.width > 0 && image.height > 0) ||
    image.width > POLICY.designExportTextureEdge ||
    image.height > POLICY.designExportTextureEdge
  )
    throw new DesignExportError('too-large');
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  try {
    const c = canvas.getContext('2d');
    if (!c) throw new DesignExportError('graphics');
    if (map instanceof DataTexture && image.data) {
      const pixels = c.createImageData(image.width, image.height);
      if (image.data.length !== pixels.data.length)
        throw new DesignExportError('failed');
      pixels.data.set(image.data);
      c.putImageData(pixels, 0, 0);
    } else c.drawImage(map.image as CanvasImageSource, 0, 0);
    const blob = await withExportSignal(
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new DesignExportError('failed'))),
          'image/png',
        ),
      ),
      signal,
    );
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    canvas.width = canvas.height = 1;
  }
}
/** Wavefront mesh interchange: world metres/Y-up, MTL + local diffuse PNGs; no PBR equivalence claim. */
export async function objFiles(
  root: Group,
  signal: AbortSignal,
  check: () => void,
  encodeTexture = texturePng,
) {
  const files: Record<string, Uint8Array> = {};
  const chunks: Uint8Array[] = [];
  let lines: string[] = [],
    bytes = 0,
    vertexOffset = 0,
    uvOffset = 0,
    normalOffset = 0;
  const flush = () => {
    if (!lines.length) return;
    const chunk = encoder.encode(lines.join(''));
    bytes += chunk.byteLength;
    if (bytes > POLICY.designExportObjBytes)
      throw new DesignExportError('too-large');
    chunks.push(chunk);
    lines = [];
  };
  const add = (line: string) => {
    lines.push(line + '\n');
    if (lines.length >= 1024) flush();
  };
  const meshes: Mesh[] = [];
  root.updateMatrixWorld(true);
  root.traverse((node) => {
    if (node instanceof Mesh) meshes.push(node);
  });
  const materials = new Map<MeshStandardMaterial | MeshBasicMaterial, string>();
  for (const mesh of meshes)
    for (const m of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      if (!(
        m instanceof MeshStandardMaterial || m instanceof MeshBasicMaterial
      ))
        throw new DesignExportError('failed');
      if (!materials.has(m)) materials.set(m, `finish_${materials.size + 1}`);
    }
  add('# Roomedy room model. Units: metres. Y is up.');
  add('mtllib roomedy-design.mtl');
  const vertex = new Vector3(),
    normal = new Vector3(),
    matrix = new Matrix3();
  for (const [meshIndex, mesh] of meshes.entries()) {
    check();
    const g = mesh.geometry,
      positions = g.getAttribute('position'),
      normals = g.getAttribute('normal'),
      uvs = g.getAttribute('uv'),
      indices = g.index;
    add(`o piece_${meshIndex + 1}`);
    matrix.getNormalMatrix(mesh.matrixWorld);
    for (let i = 0; i < positions.count; i++) {
      if (i % 1024 === 0) {
        check();
        await new Promise<void>((done) => setTimeout(done, 0));
      }
      vertex.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
      add(`v ${number(vertex.x)} ${number(vertex.y)} ${number(vertex.z)}`);
      if (uvs) add(`vt ${number(uvs.getX(i))} ${number(uvs.getY(i))}`);
      if (normals) {
        normal.fromBufferAttribute(normals, i).applyMatrix3(matrix).normalize();
        add(`vn ${number(normal.x)} ${number(normal.y)} ${number(normal.z)}`);
      }
    }
    const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    let last = -1;
    for (let i = 0; i < (indices?.count ?? positions.count); i += 3) {
      if (i % 3072 === 0) {
        check();
        await new Promise<void>((done) => setTimeout(done, 0));
      }
      const group = g.groups.find(
          (part) => i >= part.start && i < part.start + part.count,
        ),
        mi = Array.isArray(mesh.material) ? (group?.materialIndex ?? 0) : 0;
      if (mi !== last) {
        const m = ms[mi];
        if (!(
          m instanceof MeshStandardMaterial || m instanceof MeshBasicMaterial
        ))
          throw new DesignExportError('failed');
        add('usemtl ' + materials.get(m));
        last = mi;
      }
      const face = [0, 1, 2].map((offset) => {
        const j = (indices ? indices.getX(i + offset) : i + offset) + 1;
        return `${vertexOffset + j}${uvs || normals ? '/' + (uvs ? uvOffset + j : '') + (normals ? '/' + (normalOffset + j) : '') : ''}`;
      });
      add('f ' + face.join(' '));
    }
    vertexOffset += positions.count;
    if (uvs) uvOffset += uvs.count;
    if (normals) normalOffset += normals.count;
  }
  flush();
  const obj = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    obj.set(chunk, offset);
    offset += chunk.length;
  }
  chunks.length = 0;
  files['roomedy-design.obj'] = obj;
  const mtl = [
    '# Roomedy diffuse materials. Advanced PBR properties are preserved by GLB instead.',
  ];
  const textures = new Map<Texture, string>();
  for (const [material, name] of materials) {
    check();
    const color = new Color(material.color).convertLinearToSRGB();
    mtl.push(
      `newmtl ${name}`,
      `Kd ${number(color.r)} ${number(color.g)} ${number(color.b)}`,
      `d ${number(material.opacity)}`,
      'illum 2',
    );
    if (material.map) {
      const map = material.map;
      let path = textures.get(map);
      if (!path) {
        path = `textures/finish_${textures.size + 1}.png`;
        textures.set(map, path);
        files[path] = await encodeTexture(map, signal);
        bytes += files[path]!.byteLength;
      }
      mtl.push(
        `map_Kd -s ${number(map.repeat.x)} ${number(map.repeat.y)} 1 -o ${number(map.offset.x)} ${number(map.offset.y)} 0 ${path}`,
      );
    }
    mtl.push('');
    if (bytes > POLICY.designExportObjBytes)
      throw new DesignExportError('too-large');
  }
  files['roomedy-design.mtl'] = encoder.encode(mtl.join('\n'));
  files['README.txt'] = encoder.encode(
    'Roomedy 3D mesh export\n\nExtract this ZIP, keeping the OBJ, MTL and textures together. Import roomedy-design.obj. Set import units to metres and up axis to Y.\n\nOBJ carries geometry and diffuse materials; use GLB for PBR appearance. Roomedy JSON is the editable project. Unmeasured pieces remain small size-not-recorded markers; the model is not CAD/BIM or measurement certification.\n',
  );
  check();
  if (
    Object.values(files).reduce((sum, b) => sum + b.byteLength, 0) >
    POLICY.designExportObjBytes - 65536
  )
    throw new DesignExportError('too-large');
  return files;
}
export async function exportObj(
  room: RoomDocument,
  signal: AbortSignal,
  check: () => void,
) {
  const assets = await loadDesignAssets(room, signal);
  let projection: ReturnType<typeof buildDesignScene> | undefined;
  try {
    check();
    projection = buildDesignScene(room, assets.ready);
    await projection.prepareSurfaces(signal);
    check();
    projection.prepareGlass();
    const files = await objFiles(projection.root, signal, check);
    const { zipSync } = await import('three/addons/libs/fflate.module.js');
    check();
    const bytes = zipSync(files, { level: 0 });
    check();
    if (bytes.byteLength > POLICY.designExportObjBytes)
      throw new DesignExportError('too-large');
    return new Blob([Uint8Array.from(bytes)], { type: 'application/zip' });
  } finally {
    projection?.dispose();
    assets.dispose();
  }
}
