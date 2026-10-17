import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeBoundaries } from './check-boundaries.mjs';

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
