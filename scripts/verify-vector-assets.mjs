import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VECTOR_ASSET_MANIFEST } from '../vector-assets.manifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folders = [
  { name: 'actors', prefix: '' },
  { name: 'eggs', prefix: 'egg-' },
];
const expected = [];
for (const { name, prefix } of folders) {
  const directory = path.join(root, 'assets', 'vector', name);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.svg'))
    .map(entry => entry.name)
    .sort();
  assert.equal(entries.length, files.length, `Only original SVG files may be shipped from assets/vector/${name}`);
  assert.equal(files.length, name === 'actors' ? 25 : 24, `Unexpected authored SVG count in assets/vector/${name}`);
  for (const file of files) expected.push({
    key: prefix + path.basename(file, '.svg'),
    sourcePath: `assets/vector/${name}/${file}`,
    url: `./assets/vector/${name}/${file}`,
  });
}

assert.equal(expected.length, 49, 'Bounko must publish 49 authored SVG sources (25 actors and 24 eggs)');
assert.equal(VECTOR_ASSET_MANIFEST.length, expected.length, 'Every authored source must appear in the startup manifest');
assert.equal(new Set(VECTOR_ASSET_MANIFEST.map(source => source.key)).size, expected.length, 'Manifest keys must be unique');

let sourceBytes = 0;
for (let index = 0; index < expected.length; index++) {
  const actual = VECTOR_ASSET_MANIFEST[index];
  const wanted = expected[index];
  assert.deepEqual({ key: actual.key, sourcePath: actual.sourcePath, url: actual.url }, wanted,
    `Manifest source order/path changed at index ${index}`);
  const bytes = await readFile(path.join(root, wanted.sourcePath));
  sourceBytes += bytes.byteLength;
  assert.ok(bytes.byteLength <= 64 * 1024, `${wanted.sourcePath} exceeds the runtime per-source limit`);
  assert.equal(actual.sha256, createHash('sha256').update(bytes).digest('hex'),
    `Manifest source hash is stale: ${wanted.sourcePath}`);
}

for (const forbidden of ['vector-assets.generated.js', 'scripts/compile-vector-assets.mjs']) {
  await assert.rejects(stat(path.join(root, forbidden)), { code: 'ENOENT' },
    `${forbidden} must not remain in the shipped source tree`);
}
const html = await readFile(path.join(root, 'index.html'), 'utf8');
assert.doesNotMatch(html, /vector-assets\.generated\.js/, 'the main page must not import compiled character data');

console.log(JSON.stringify({ sourceCount: expected.length, sourceBytes, compiledBundleBytes: 0 }));
