import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { CATALOGUE } from '@roomedy/spatial';
import { checkSurfaceAssets } from './check-surface-assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
checkSurfaceAssets(root);
const directory = path.join(root, 'apps/frontend/public/catalogue');
const requireFrontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { GLTFLoader } = await import(
  pathToFileURL(requireFrontend.resolve('three/addons/loaders/GLTFLoader.js'))
    .href
);
const threePackage = path.resolve(
  path.dirname(requireFrontend.resolve('three')),
  '..',
);
const threeExports = JSON.parse(
  readFileSync(path.join(threePackage, 'package.json'), 'utf8'),
).exports;
const { Box3, Vector3 } = await import(
  pathToFileURL(path.join(threePackage, threeExports['.'].import)).href
);
const manifest = JSON.parse(
  readFileSync(path.join(directory, 'manifest.json'), 'utf8'),
);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.source.license, 'CC0-1.0');
assert.equal(
  hash(readFileSync(path.join(directory, 'LICENSE-Kenney.txt'))),
  manifest.source.licenseSha256,
);
for (const asset of manifest.assets) {
  assert.match(asset.preparedFilename, /^[a-z-]+-v1\.glb$/);
  const bytes = readFileSync(path.join(directory, asset.preparedFilename));
  assert.equal(hash(bytes), asset.sha256);
  assert.equal(bytes.length, asset.bytes);
  assert.ok(bytes.length <= manifest.budgets.assetBytes);
  const jsonLength = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  assert.ok(document.buffers.every((buffer) => !buffer.uri));
  assert.equal((document.images ?? []).length, 0);
  assert.equal((document.animations ?? []).length, 0);
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  const bounds = new Box3().setFromObject(gltf.scene);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  assert.ok(Math.abs(bounds.min.y) < 0.000001);
  assert.ok(Math.abs(center.x) < 0.000001 && Math.abs(center.z) < 0.000001);
  const entry = CATALOGUE.find((entry) => entry.id === asset.catalogueId);
  assert.ok(entry && !entry.adjustable);
  for (const [axis, actual] of [
    ['width', size.x],
    ['depth', size.z],
    ['height', size.y],
  ]) {
    assert.equal(entry.size[axis].default, asset.semanticMm[axis]);
    assert.ok(actual * 1000 <= asset.semanticMm[axis] + 0.001);
    assert.ok(actual * 1000 >= asset.semanticMm[axis] * 0.95);
  }
  for (const turns of [0, 1, 2, 3]) {
    gltf.scene.rotation.y = (-turns * Math.PI) / 2;
    gltf.scene.updateMatrixWorld(true);
    const rotated = new Box3().setFromObject(gltf.scene);
    const dimensions = rotated.getSize(new Vector3());
    const expectedWidth =
      turns % 2 ? asset.semanticMm.depth : asset.semanticMm.width;
    const expectedDepth =
      turns % 2 ? asset.semanticMm.width : asset.semanticMm.depth;
    assert.ok(dimensions.x * 1000 <= expectedWidth + 0.001);
    assert.ok(dimensions.z * 1000 <= expectedDepth + 0.001);
    assert.ok(Math.abs(rotated.min.y) < 0.000001);
  }
  let triangles = 0;
  const materials = new Set();
  gltf.scene.traverse((object) => {
    if (object.isMesh) {
      triangles +=
        (object.geometry.index?.count ??
          object.geometry.attributes.position.count) / 3;
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(material);
      object.geometry.dispose();
    }
  });
  assert.equal(triangles, asset.triangles);
  assert.ok(
    triangles <= manifest.budgets.triangles &&
      materials.size <= manifest.budgets.materials,
  );
  for (const material of materials) material.dispose();
}
assert.equal(manifest.thumbnails.length, CATALOGUE.length);
for (const thumbnail of manifest.thumbnails) {
  assert.match(thumbnail.filename, /^thumbnails\/[a-z-]+\.svg$/);
  const bytes = readFileSync(path.join(directory, thumbnail.filename));
  assert.equal(hash(bytes), thumbnail.sha256);
  assert.equal(bytes.length, thumbnail.bytes);
  assert.ok(bytes.length < 256 * 1024);
  assert.doesNotMatch(
    bytes.toString(),
    /<script|<foreignObject|\bon\w+=|(?:href|src)=/i,
  );
  const entry = CATALOGUE.find((entry) => entry.id === thumbnail.catalogueId);
  assert.ok(entry);
  assert.equal(thumbnail.filename, `thumbnails/${entry.assetId}.svg`);
}
assert.deepEqual(
  readdirSync(directory).sort(),
  [
    'LICENSE-Kenney.txt',
    'bedside-storage-v1.glb',
    'chair-desk-v1.glb',
    'manifest.json',
    'thumbnails',
  ].sort(),
);
console.info(
  `Verified ${manifest.assets.length} embedded GLBs, ${manifest.thumbnails.length} SVGs, exact licenses/hashes, floor/center/size and geometry budgets.`,
);
