import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { imageHeader } from '@roomedy/contracts/intake';

/** Only the committed opaque RGBA8, non-interlaced PNG derivative format. */
export function surfacePngPixels(bytes, edge) {
  const header = imageHeader(bytes);
  assert.deepEqual(header, { type: 'image/png', width: edge, height: edge });
  assert.equal(bytes[24], 8);
  assert.equal(bytes[25], 6);
  assert.equal(bytes[28], 0);
  const compressed = [];
  for (let at = 8; at + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(at),
      kind = bytes.toString('ascii', at + 4, at + 8);
    if (kind === 'IDAT')
      compressed.push(bytes.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const stride = edge * 4,
    raw = inflateSync(Buffer.concat(compressed), {
      maxOutputLength: (stride + 1) * edge,
    }),
    output = new Uint8Array(edge * stride);
  assert.equal(raw.length, (stride + 1) * edge);
  const paeth = (a, b, c) => {
    const p = a + b - c,
      x = Math.abs(p - a),
      y = Math.abs(p - b),
      z = Math.abs(p - c);
    return x <= y && x <= z ? a : y <= z ? b : c;
  };
  for (let y = 0; y < edge; y++) {
    const filter = raw[y * (stride + 1)];
    assert.ok(filter >= 0 && filter <= 4);
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x,
        left = x >= 4 ? output[at - 4] : 0,
        up = y ? output[at - stride] : 0,
        corner = y && x >= 4 ? output[at - stride - 4] : 0,
        prediction =
          filter === 0
            ? 0
            : filter === 1
              ? left
              : filter === 2
                ? up
                : filter === 3
                  ? Math.floor((left + up) / 2)
                  : paeth(left, up, corner);
      output[at] = (raw[y * (stride + 1) + 1 + x] + prediction) & 255;
    }
  }
  return output;
}

export function checkSurfaceAssets(root) {
  const folder = path.join(root, 'apps/frontend/public/surfaces'),
    manifest = JSON.parse(
      readFileSync(path.join(folder, 'manifest.json'), 'utf8'),
    ),
    names = ['floor', 'wood', 'fabric', 'plaster'];
  assert.equal(manifest.version, 1);
  assert.equal(manifest.license, 'CC0-1.0');
  assert.equal(manifest.licenseUrl, 'https://polyhaven.com/license');
  assert.deepEqual(
    manifest.materials.map((m) => m.kind),
    names,
  );
  const expected = ['LICENSES.md', 'manifest.json'];
  let total = 0,
    mipBytes = (128 ** 2 + 256 ** 2 + 128 ** 2) * 4 * (4 / 3);
  for (const material of manifest.materials) {
    assert.equal(
      material.edge,
      ['floor', 'wood'].includes(material.kind) ? 512 : 256,
    );
    assert.match(material.author, /\S/);
    assert.equal(
      material.sourcePage,
      `https://polyhaven.com/a/${material.sourceAsset}`,
    );
    assert.deepEqual(material.sources.map((s) => s.map).sort(), [
      'Diffuse',
      'Rough',
      'nor_gl',
    ]);
    for (const source of material.sources) {
      assert.ok(
        source.url.startsWith(
          'https://dl.polyhaven.org/file/ph-assets/Textures/',
        ),
      );
      assert.ok(source.bytes > 0 && source.bytes <= 4 * 1024 * 1024);
      assert.match(source.sha256, /^[a-f0-9]{64}$/);
    }
    assert.equal(material.files.length, 2);
    for (const [index, file] of material.files.entries()) {
      assert.equal(
        file.filename,
        `${material.kind}-${index ? 'normal' : 'detail'}-v1.png`,
      );
      const raw = readFileSync(path.join(folder, file.filename));
      assert.equal(raw.length, file.bytes);
      assert.equal(createHash('sha256').update(raw).digest('hex'), file.sha256);
      assert.ok(raw.length <= 256 * 1024);
      const pixels = surfacePngPixels(raw, material.edge);
      let changes = 0;
      for (let at = 0; at < pixels.length; at += 4) {
        assert.equal(pixels[at + 3], 255);
        if (!index) {
          assert.equal(pixels[at + 2], 0);
          assert.ok(pixels[at] >= material.albedoMinimum - 1);
          assert.ok(pixels[at + 1] >= 184);
        } else {
          const length = Math.hypot(
            ...[0, 1, 2].map((axis) => pixels[at + axis] / 127.5 - 1),
          );
          assert.ok(length > 0.98 && length < 1.02);
        }
        if (at && pixels[at] !== pixels[at - 4]) changes++;
      }
      assert.ok(changes > material.edge);
      expected.push(file.filename);
      total += raw.length;
    }
    mipBytes += material.edge ** 2 * 4 * 3 * (4 / 3);
  }
  assert.equal(total, manifest.bytes);
  assert.ok(total <= 1024 * 1024);
  assert.ok(mipBytes <= 16 * 1024 * 1024);
  assert.deepEqual(readdirSync(folder).sort(), expected.sort());
  assert.match(
    readFileSync(path.join(folder, 'LICENSES.md'), 'utf8'),
    /CC0 1\.0/,
  );
  console.log(
    `Verified 8 local CC0 material PNGs, ${total} bytes, ${mipBytes} nominal texture/mipmap bytes, exact hashes, packed channels and GL normals.`,
  );
}
