export async function loadVectorAssets({ loader, manifest, baseUrl, maxBytes = 64 * 1024 }) {
  if (!loader || typeof loader.load !== 'function') throw new TypeError('A GameKit vector asset loader is required');
  if (!Array.isArray(manifest) || manifest.length === 0) throw new TypeError('A nonempty SVG asset manifest is required');
  if (typeof baseUrl !== 'string' && !(baseUrl instanceof URL)) throw new TypeError('A browser base URL is required');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new RangeError('maxBytes must be a positive integer');

  const ids = new Set();
  const sources = manifest.map(source => {
    if (!source || typeof source.key !== 'string' || !source.key || ids.has(source.key)) {
      throw new TypeError('Every vector source must have a unique nonempty key');
    }
    ids.add(source.key);
    if (typeof source.url !== 'string' || typeof source.sourcePath !== 'string'
        || typeof source.sha256 !== 'string') {
      throw new TypeError(`Invalid vector source entry: ${source.key}`);
    }
    if (!/^[a-f0-9]{64}$/i.test(source.sha256)) {
      throw new TypeError(`Invalid SHA-256 for vector source: ${source.key}`);
    }
    return source;
  });
  const entries = await Promise.all(sources.map(async source => {
    const url = new URL(source.url, baseUrl);
    const compiledAsset = await loader.load(url, {
      sourcePath: source.sourcePath,
      expectedSha256: source.sha256,
      maxBytes,
      curveSegments: 16,
      includeSourcePaths: false,
      normalizeCenteredViewBox: true,
    });
    return [source.key, compiledAsset];
  }));
  return Object.freeze(Object.fromEntries(entries));
}
