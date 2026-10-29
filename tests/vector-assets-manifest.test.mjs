import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { VECTOR_ASSET_MANIFEST } from '../vector-assets.manifest.js';
import { loadVectorAssets } from '../vector-assets-runtime.js';

const VECTOR_BASELINE = JSON.parse(await readFile(new URL('./fixtures/vector-assets-pr58-fingerprint.json', import.meta.url), 'utf8'));

test('PR58 regression fingerprints cover the same original sources as the startup manifest', () => {
  assert.equal(VECTOR_BASELINE.sourceCommit, '432e4d4be36e22f872d07d1f5f177e6c9fe8242b');
  assert.equal(VECTOR_BASELINE.sourceCount, 49);
  assert.deepEqual(Object.keys(VECTOR_BASELINE.assets).sort(), VECTOR_ASSET_MANIFEST.map(source => source.key).sort());
  for (const source of VECTOR_ASSET_MANIFEST) {
    assert.equal(VECTOR_BASELINE.assets[source.key].sourceSha256, source.sha256, `${source.key} baseline must match its original SVG`);
    assert.deepEqual(Object.keys(VECTOR_BASELINE.assets[source.key]).sort(), VECTOR_BASELINE.normalizedFieldSet.slice().sort());
  }
});

test('loads the complete source manifest once through the SDK loader before renderer setup', async () => {
  const calls = [];
  const loader = {
    async load(url, options) {
      calls.push({ url: String(url), options });
      return Object.freeze({ id: options.sourcePath });
    },
  };
  const assets = await loadVectorAssets({
    loader,
    manifest: VECTOR_ASSET_MANIFEST,
    baseUrl: 'https://example.test/bloom-bounko/index.html',
  });

  assert.equal(Object.keys(assets).length, 49);
  assert.equal(calls.length, 49);
  assert.equal(new Set(calls.map(call => call.url)).size, 49);
  assert.deepEqual(calls[0], {
    url: 'https://example.test/bloom-bounko/assets/vector/actors/brute.svg',
    options: {
      sourcePath: 'assets/vector/actors/brute.svg',
      expectedSha256: '200d9d21cbc541f2c350132d6b8791f9f159254df37607e7ff191268a7ea2f90',
      maxBytes: 64 * 1024,
      curveSegments: 16,
      strokeArcDivisions: 12,
      includeSourcePaths: false,
      normalizeCenteredViewBox: true,
    },
  });
  assert.equal(assets.player.id, 'assets/vector/actors/player.svg');
  assert.equal(assets['egg-brute'].id, 'assets/vector/eggs/brute.svg');
  assert.equal(Object.isFrozen(assets), true);
});

test('rejects duplicate asset IDs before returning an ambiguous registry', async () => {
  let loadCalls = 0;
  const loader = { async load() { loadCalls++; return {}; } };
  await assert.rejects(loadVectorAssets({
    loader,
    manifest: [
      { key: 'same', sourcePath: 'a.svg', url: './a.svg', sha256: 'a'.repeat(64) },
      { key: 'same', sourcePath: 'b.svg', url: './b.svg', sha256: 'b'.repeat(64) },
    ],
    baseUrl: 'https://example.test/',
  }), /unique nonempty key/);
  assert.equal(loadCalls, 0, 'invalid manifests should be rejected before the loader starts fetching');
});
