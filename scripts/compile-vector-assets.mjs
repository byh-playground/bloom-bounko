import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const sources = [
  { directory: path.join(root, 'assets', 'vector', 'actors'), prefix: '' },
  { directory: path.join(root, 'assets', 'vector', 'eggs'), prefix: 'egg-' },
];
const outputPath = path.join(root, 'vector-assets.generated.js');
const compilerCommit = '12aa27b7508bcffd284181645ca51a5684dbfdbd';
const compilerModules = [
  {
    name: 'compiler.js',
    sha256: 'dc57bec50d0f46e6b004840722843f91904b8e3d37e3e7ade2a74f0e92e99f68',
  },
  {
    name: 'schema.js',
    sha256: '4d649b001822c6377371cec6a83fcf8f3a77e702326b963a221997d1e677863c',
  },
];
const cacheDirectory = path.join(root, 'scripts', '.cache', `gamekit-${compilerCommit}`);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function loadPinnedCompiler() {
  await mkdir(cacheDirectory, { recursive: true });
  for (const module of compilerModules) {
    const destination = path.join(cacheDirectory, module.name);
    let bytes = await readFile(destination).catch(error => error.code === 'ENOENT' ? null : Promise.reject(error));
    if (!bytes || sha256(bytes) !== module.sha256) {
      const url = `https://raw.githubusercontent.com/byh-playground/bloom-gamekit/${compilerCommit}/modules/vector-assets/${module.name}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not fetch pinned GameKit compiler ${module.name}: HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      if (sha256(bytes) !== module.sha256) throw new Error(`Pinned GameKit compiler hash mismatch: ${module.name}`);
      await writeFile(destination, bytes);
    }
  }
  const compilerPath = path.join(cacheDirectory, 'compiler.js');
  return import(`${pathToFileURL(compilerPath).href}?commit=${compilerCommit}`);
}

function rootAttributes(source, file) {
  const rootTag = source.match(/<svg\b[^>]*>/)?.[0];
  if (!rootTag) throw new Error(`${file}: missing SVG root`);
  const attribute = name => rootTag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
  const width = Number(attribute('width'));
  const height = Number(attribute('height'));
  const viewBox = attribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || !viewBox || viewBox.length !== 4
      || viewBox.some(value => !Number.isFinite(value)) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    throw new Error(`${file}: root width, height, and viewBox must be finite SVG numbers`);
  }
  return { rootTag, viewBox };
}

function normalizeForCompiler(source, file) {
  const { rootTag, viewBox } = rootAttributes(source, file);
  const metadataMatch = source.match(/<metadata\s+id="vector-asset">([\s\S]*?)<\/metadata>/);
  if (!metadataMatch) throw new Error(`${file}: missing direct vector-asset metadata`);
  const metadata = JSON.parse(metadataMatch[1]);
  let removedNoopPoses = 0;
  for (const clip of Object.values(metadata.clips ?? {})) {
    for (const frame of clip.keyframes ?? []) {
      for (const [part, pose] of Object.entries(frame.parts ?? {})) {
        if (pose && typeof pose === 'object' && !Array.isArray(pose) && Object.keys(pose).length === 0) {
          delete frame.parts[part];
          removedNoopPoses++;
        }
      }
    }
  }

  // GameKit requires origin-zero, unitless SVG viewport dimensions. Bounko
  // intentionally authors centered local coordinates and legacy pixel-sized
  // root dimensions. This build-only normalization changes only root viewport
  // attributes and removes empty no-op keyframe poses; it leaves every painted
  // coordinate, paint value, part pivot, socket, and non-empty clip pose intact.
  const quote = String.fromCharCode(34);
  const normalizedRoot = rootTag
    .replace(/\bwidth="[^"]+"/, `width=${quote}${viewBox[2]}${quote}`)
    .replace(/\bheight="[^"]+"/, `height=${quote}${viewBox[3]}${quote}`)
    .replace(/\bviewBox="[^"]+"/, `viewBox=${quote}0 0 ${viewBox[2]} ${viewBox[3]}${quote}`);
  const normalizedMetadata = `<metadata id=${quote}vector-asset${quote}>${JSON.stringify(metadata)}</metadata>`;
  return {
    bytes: Buffer.from(source.replace(rootTag, normalizedRoot).replace(metadataMatch[0], normalizedMetadata), 'utf8'),
    originalViewBox: viewBox,
    removedNoopPoses,
  };
}

function serializedValue(asset, exportName, compiledAssetModuleSource) {
  const source = compiledAssetModuleSource(asset, exportName);
  const prefix = `export const ${exportName} = `;
  if (!source.startsWith(prefix) || !source.endsWith(';\n')) throw new Error('Unexpected GameKit asset serializer output');
  return source.slice(prefix.length, -2);
}

const { compileVectorAsset, compiledAssetModuleSource } = await loadPinnedCompiler();
const files = [];
for (const source of sources) {
  const names = (await readdir(source.directory).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error)))
    .filter(name => name.endsWith('.svg')).sort();
  for (const name of names) files.push({ key: source.prefix + path.basename(name, '.svg'), file: path.join(source.directory, name) });
}
if (!files.length) throw new Error('No SVG vector sources found');

const variables = [];
const entries = [];
let triangleCount = 0;
let removedNoopPoseCount = 0;
for (let index = 0; index < files.length; index++) {
  const { key, file } = files[index];
  const bytes = await readFile(file);
  const normalized = normalizeForCompiler(bytes.toString('utf8'), path.relative(root, file));
  const asset = await compileVectorAsset(normalized.bytes, path.relative(root, file).replaceAll('\\', '/'));
  // The compiler only sees normalized root viewport metadata and semantically
  // empty keyframe entries. Runtime geometry and source provenance stay tied to
  // the unchanged, authored SVG file.
  asset.sourceSha256 = sha256(bytes);
  asset.viewBox = normalized.originalViewBox;
  const { sourcePaths: _sourcePaths, ...runtimeAsset } = asset;
  const variable = `_vectorAsset${index}`;
  variables.push(`const ${variable}=${serializedValue(runtimeAsset, variable, compiledAssetModuleSource)};`);
  entries.push(`${JSON.stringify(key)}:${variable}`);
  triangleCount += asset.geometry.vertices.length / 33;
  removedNoopPoseCount += normalized.removedNoopPoses;
}

const output = [
  `// Generated by scripts/compile-vector-assets.mjs using Bloom GameKit compiler ${compilerCommit}.`,
  '// Authored SVG files are the only source of geometry and animation data.',
  ...variables,
  `export const VECTOR_ASSETS=Object.freeze({${entries.join(',')}});`,
  '',
].join('\n');
if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== output) throw new Error('vector-assets.generated.js is stale; run npm run vector-assets:compile');
} else await writeFile(outputPath, output, 'utf8');

console.log(JSON.stringify({
  compilerCommit,
  sourceCount: files.length,
  actorCount: files.filter(file => !file.key.startsWith('egg-')).length,
  eggCount: files.filter(file => file.key.startsWith('egg-')).length,
  triangleCount,
  removedNoopPoseCount,
  outputBytes: Buffer.byteLength(output),
  check: process.argv.includes('--check'),
}));
