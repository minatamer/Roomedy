import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const pureGlobals = new Set([
  'process',
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'Buffer',
  'setTimeout',
  'setInterval',
]);

/** Analyze real TS syntax, including re-exports, dynamic imports and transitive client reachability. */
export function analyzeBoundaries(input) {
  const files = new Map(
    Object.entries(input).map(([name, text]) => [
      name.replaceAll('\\', '/'),
      text,
    ]),
  );
  const errors = [];
  const graph = new Map();
  const clients = [];
  const serverFiles = new Set();
  for (const [name, text] of files) {
    const source = ts.createSourceFile(
      name,
      text,
      ts.ScriptTarget.Latest,
      true,
      name.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const references = [];
    if (
      source.statements.some(
        (s) =>
          ts.isExpressionStatement(s) &&
          ts.isStringLiteral(s.expression) &&
          s.expression.text === 'use client',
      )
    )
      clients.push(name);
    if (name.includes('/server/') || name.includes('.server.'))
      serverFiles.add(name);
    const pure =
      name.startsWith('packages/contracts/') ||
      name.startsWith('packages/spatial/');
    const visit = (node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        references.push(node.moduleSpecifier.text);
      if (ts.isImportEqualsDeclaration(node))
        errors.push(`${name}: import-equals is not an allowed ESM boundary`);
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === 'require'))
      ) {
        const value = node.arguments[0];
        if (value && ts.isStringLiteral(value)) references.push(value.text);
        else
          errors.push(
            `${name}: nonliteral module import cannot be boundary-checked`,
          );
      }
      if (pure && ts.isIdentifier(node) && pureGlobals.has(node.text))
        errors.push(`${name}: pure package uses ${node.text}`);
      if (
        pure &&
        ts.isPropertyAccessExpression(node) &&
        ['Date.now', 'Math.random'].includes(node.getText(source))
      )
        errors.push(`${name}: pure package uses nondeterminism`);
      if (
        name.startsWith('apps/backend/src/') &&
        name !== 'apps/backend/src/server.ts'
      ) {
        if (
          ts.isPropertyAccessExpression(node) &&
          node.getText(source) === 'process.env'
        )
          errors.push(`${name}: environment access belongs to startup`);
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'listen'
        )
          errors.push(`${name}: listener belongs to startup`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    const resolved = [];
    for (const specifier of references) {
      const relative = specifier.startsWith('.');
      const targetBase = relative
        ? path.posix.normalize(
            path.posix.join(path.posix.dirname(name), specifier),
          )
        : specifier;
      let target;
      if (relative)
        target = [
          targetBase,
          `${targetBase}.ts`,
          `${targetBase}.tsx`,
          targetBase.replace(/\.js$/, '.ts'),
          targetBase.replace(/\.js$/, '.tsx'),
          `${targetBase}/index.ts`,
        ].find((p) => files.has(p));
      else if (specifier.startsWith('@roomedy/contracts/'))
        target = `packages/contracts/src/${specifier.slice('@roomedy/contracts/'.length)}.ts`;
      else if (specifier === '@roomedy/spatial')
        target = 'packages/spatial/src/index.ts';
      if (target) resolved.push(target);
      if (
        specifier === 'server-only' ||
        specifier.startsWith('node:') ||
        ['fs', 'http', 'https', 'net', 'dotenv'].includes(specifier)
      )
        serverFiles.add(name);
      if (
        specifier === 'dotenv' &&
        name.startsWith('apps/backend/src/') &&
        name !== 'apps/backend/src/server.ts'
      )
        errors.push(`${name}: environment loading belongs to startup`);
      const targetPath = target ?? targetBase;
      const app = name.startsWith('apps/') ? name.split('/')[1] : undefined;
      if (
        app &&
        ((targetPath.startsWith('apps/') &&
          !targetPath.startsWith(`apps/${app}/`)) ||
          /^@roomedy\/(backend|frontend)/.test(specifier))
      )
        errors.push(`${name}: cross-app import ${specifier}`);
      if (
        relative &&
        !target &&
        !(
          name.startsWith('apps/frontend/') &&
          /\.(css|svg|woff2|png|webp)$/.test(specifier)
        )
      )
        errors.push(
          `${name}: unresolved or escaping relative import ${specifier}`,
        );
      if (name.startsWith('packages/') && !relative) {
        const allowed = name.startsWith('packages/contracts/')
          ? specifier === 'zod'
          : specifier.startsWith('@roomedy/contracts/');
        if (!allowed)
          errors.push(`${name}: forbidden shared dependency ${specifier}`);
      }
      if (
        name.startsWith('packages/') &&
        relative &&
        !targetPath.startsWith(
          name.startsWith('packages/contracts/')
            ? 'packages/contracts/'
            : 'packages/spatial/',
        )
      )
        errors.push(`${name}: shared import escapes package`);
      if (
        relative &&
        targetPath.startsWith('packages/') &&
        !name.startsWith(targetPath.split('/').slice(0, 2).join('/') + '/')
      )
        errors.push(`${name}: use public shared exports`);
      if (specifier.includes('@roomedy/') && specifier.includes('/src/'))
        errors.push(`${name}: private shared subpath`);
    }
    graph.set(name, resolved);
  }
  for (const client of clients) {
    const seen = new Set();
    const visit = (file) => {
      if (seen.has(file)) return;
      seen.add(file);
      if (serverFiles.has(file))
        errors.push(`${client}: client reaches server module ${file}`);
      for (const target of graph.get(file) ?? []) visit(target);
    };
    visit(client);
  }
  return [...new Set(errors)];
}

function sourceFiles(directory) {
  const result = {};
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.next', '.next-dev'].includes(entry.name))
      continue;
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, sourceFiles(name));
    else if (
      /\.[cm]?[jt]sx?$/.test(entry.name) &&
      !entry.name.endsWith('.d.ts')
    )
      result[name.replaceAll('\\', '/')] = readFileSync(name, 'utf8');
  }
  return result;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const errors = analyzeBoundaries({
    ...sourceFiles('apps'),
    ...sourceFiles('packages'),
  });
  for (const error of errors) console.error(error);
  if (errors.length) process.exitCode = 1;
  else
    console.info(
      'Application, pure-package and transitive client boundaries passed.',
    );
}
