import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeBoundaries, sourceFiles } from './check-boundaries.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('rejects cross-app paths, aliases and private package paths', () => {
  for (const text of [
    "import x from '@roomedy/backend';",
    "import x from '../../backend/src/x.js';",
    "export * from '@roomedy/contracts/src/room';",
  ])
    assert.ok(
      analyzeBoundaries({
        'apps/frontend/src/a.ts': text,
        'apps/backend/src/x.ts': 'export const x = 1',
      }).length,
    );
});
test('rejects platform, provider and UI dependencies in pure packages', () => {
  for (const text of [
    "import 'node:fs';",
    "import 'openai';",
    "import 'react';",
    'const x = process.env;',
    'fetch("https://example.com")',
    'Date.now()',
  ])
    assert.ok(
      analyzeBoundaries({ 'packages/contracts/src/a.ts': text }).length,
    );
  assert.ok(
    analyzeBoundaries({ 'packages/spatial/src/a.ts': "import 'three';" })
      .length,
  );
});
test('rejects a client reaching server code through a re-export', () => {
  const files = {
    'apps/frontend/src/client.tsx': "'use client'; import './middle.js';",
    'apps/frontend/src/middle.ts': "export * from './server/secret.js';",
    'apps/frontend/src/server/secret.ts': 'export const secret = 1;',
  };
  assert.ok(analyzeBoundaries(files).some((v) => v.includes('client reaches')));
});
test('rejects opaque dynamic imports, permits pure public exports', () => {
  assert.ok(
    analyzeBoundaries({ 'apps/frontend/src/a.ts': 'import(variable)' }).length,
  );
  assert.deepEqual(
    analyzeBoundaries({
      'packages/contracts/src/a.ts':
        "import { z } from 'zod'; export const a = z.string();",
      'packages/spatial/src/a.ts':
        "import type { RoomDocument } from '@roomedy/contracts/room';",
    }),
    [],
  );
});
test('backend factories cannot load environment, read it, or listen', () => {
  for (const text of [
    "import 'dotenv';",
    'process.env.OPENAI_API_KEY',
    'app.listen(4321)',
  ])
    assert.ok(
      analyzeBoundaries({ 'apps/backend/src/http/create-app.ts': text }).length,
    );
});
test('spatial permits only the selected pure hash/encoding subpaths', () => {
  for (const specifier of ['@noble/hashes/sha2.js', '@noble/hashes/utils.js'])
    assert.deepEqual(
      analyzeBoundaries({
        'packages/spatial/src/a.ts': `import '${specifier}';`,
      }),
      [],
    );
  assert.ok(
    analyzeBoundaries({
      'packages/spatial/src/a.ts': "import '@noble/hashes/webcrypto.js';",
    }).length,
  );
});

test('excludes only reserved frontend release outputs and keeps real worker/lazy source reachable', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'roomedy-boundary-'));
  const put = (p, text) => {
    const file = path.join(root, p);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  };
  try {
    put('apps/frontend/.next-release-a/server/runtime.js', 'import(variable)');
    put('apps/frontend/.next-release-b/types/validator.ts', 'import(variable)');
    put('apps/frontend/src/lazy.ts', 'import(variable)');
    put(
      'apps/frontend/src/features/layout-search/worker.ts',
      'export const worker=1;',
    );
    put('apps/frontend/src/.next-release-a/source.ts', 'import(variable)');
    const rows = Object.fromEntries(
      Object.entries(sourceFiles(path.join(root, 'apps'))).map(([k, v]) => [
        k.slice(root.length + 1).replaceAll('\\', '/'),
        v,
      ]),
    );
    assert.equal(Object.keys(rows).length, 3);
    assert.ok(rows['apps/frontend/src/features/layout-search/worker.ts']);
    assert.equal(analyzeBoundaries(rows).length, 2);
  } finally {
    if (
      !path
        .resolve(root)
        .startsWith(path.join(path.resolve(tmpdir()), 'roomedy-boundary-'))
    )
      throw Error('unsafe-cleanup');
    rmSync(root, { recursive: true, force: true });
  }
});
