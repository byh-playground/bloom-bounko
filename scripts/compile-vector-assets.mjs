import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoots = [
  { directory: path.join(root, 'assets', 'vector', 'actors'), prefix: '' },
  { directory: path.join(root, 'assets', 'vector', 'eggs'), prefix: 'egg-' },
];
const outputPath = path.join(root, 'vector-assets.generated.js');
const SEGMENTS = 24;

function fail(file, message) { throw new Error(`${path.relative(root, file)}: ${message}`); }
function attributes(raw, file) {
  const result = {};
  const pattern = /([\w:-]+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = pattern.exec(raw))) {
    if (Object.hasOwn(result, match[1])) fail(file, `duplicate attribute ${match[1]}`);
    result[match[1]] = match[2];
  }
  if (raw.replace(pattern, '').replace(/\s*\/?\s*$/, '').trim()) fail(file, 'attributes must be quoted XML values');
  return result;
}
function number(value, name, file) {
  const result = Number(value);
  if (!Number.isFinite(result)) fail(file, `invalid ${name}`);
  return result;
}
function rgba(hex, opacity, file) {
  if (!/^#[\da-f]{6}$/i.test(hex)) fail(file, `unsupported SVG color ${hex}`);
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const alpha = number(opacity ?? '1', 'opacity', file);
  if (alpha < 0 || alpha > 1) fail(file, 'opacity must be in [0,1]');
  return [...channels, alpha];
}
function appendTriangle(vertices, a, b, c, color, part) {
  for (const [x, y] of [a, b, c]) vertices.push(x, y, ...color, 0, 0, 0, 0, part);
}
function appendPolygon(vertices, points, color, part) {
  const clean = points.filter((point, index) => index === 0 || Math.hypot(point[0] - points[index - 1][0], point[1] - points[index - 1][1]) > 1e-9);
  if (clean.length > 2 && Math.hypot(clean[0][0] - clean.at(-1)[0], clean[0][1] - clean.at(-1)[1]) <= 1e-9) clean.pop();
  if (clean.length < 3) throw new Error('painted polygon requires at least three distinct points');
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
  const area = clean.reduce((sum, point, index) => {
    const next = clean[(index + 1) % clean.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);
  if (Math.abs(area) <= 1e-9) throw new Error('painted polygon has zero area');
  const orientation = Math.sign(area), remaining = clean.map((_, index) => index), triangles = [];
  const inside = (point, a, b, c) => {
    const ab = orientation * cross(a, b, point), bc = orientation * cross(b, c, point), ca = orientation * cross(c, a, point);
    return ab >= -1e-9 && bc >= -1e-9 && ca >= -1e-9;
  };
  let guard = clean.length * clean.length;
  while (remaining.length > 3 && guard-- > 0) {
    let clipped = false;
    for (let index = 0; index < remaining.length; index++) {
      const before = remaining[(index + remaining.length - 1) % remaining.length];
      const current = remaining[index], after = remaining[(index + 1) % remaining.length];
      const a = clean[before], b = clean[current], c = clean[after];
      if (orientation * cross(a, b, c) <= 1e-9) continue;
      if (remaining.some(candidate => candidate !== before && candidate !== current && candidate !== after && inside(clean[candidate], a, b, c))) continue;
      triangles.push([a, b, c]);
      remaining.splice(index, 1);
      clipped = true;
      break;
    }
    if (!clipped) throw new Error('polygon is self-intersecting or could not be triangulated');
  }
  if (remaining.length !== 3) throw new Error('polygon triangulation did not converge');
  triangles.push(remaining.map(index => clean[index]));
  for (const triangle of triangles) appendTriangle(vertices, ...triangle, color, part);
}
function appendEllipse(vertices, cx, cy, rx, ry, color, part) {
  if (rx <= 0 || ry <= 0) throw new Error('ellipse radii must be positive');
  const points = Array.from({ length: SEGMENTS }, (_, index) => {
    const angle = index * Math.PI * 2 / SEGMENTS;
    return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
  });
  appendPolygon(vertices, [[cx, cy], ...points], color, part);
}
function appendLine(vertices, x1, y1, x2, y2, width, color, part) {
  if (width <= 0) throw new Error('stroke width must be positive');
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
  if (length <= 1e-9) { appendEllipse(vertices, x1, y1, width / 2, width / 2, color, part); return; }
  const nx = -dy / length * width / 2, ny = dx / length * width / 2;
  appendPolygon(vertices, [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], color, part);
  appendEllipse(vertices, x1, y1, width / 2, width / 2, color, part);
  appendEllipse(vertices, x2, y2, width / 2, width / 2, color, part);
}
function compileSvg(bytes, file) {
  const source = bytes.toString('utf8');
  if (!bytes.length || bytes.byteLength > 512 * 1024) fail(file, 'SVG source must be 1..512 KiB');
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet|<script\b|<foreignObject\b|<image\b|<filter\b|<mask\b|<style\b|\bhref\s*=|url\s*\(/i.test(source)) fail(file, 'external resources, CSS, scripts, filters, and masks are unsupported');
  const metadataText = source.match(/<metadata\s+id="vector-asset">([\s\S]*?)<\/metadata>/)?.[1];
  if (!metadataText) fail(file, 'direct vector-asset metadata is required');
  let metadata;
  try { metadata = JSON.parse(metadataText); } catch { fail(file, 'metadata is not valid JSON'); }
  if (metadata.schemaVersion !== 1 || !Array.isArray(metadata.parts) || !metadata.parts.length || metadata.parts.length > 16) fail(file, 'unsupported vector-asset metadata');
  const partIndices = new Map(metadata.parts.map((part, index) => [part.id, index]));
  if (partIndices.size !== metadata.parts.length) fail(file, 'part ids must be unique');
  const viewBoxRaw = source.match(/<svg\b[^>]*\bviewBox="([^"]+)"/)?.[1];
  const viewBox = viewBoxRaw?.trim().split(/[\s,]+/).map(Number);
  if (!viewBox || viewBox.length !== 4 || viewBox.some(value => !Number.isFinite(value)) || viewBox[2] <= 0 || viewBox[3] <= 0) fail(file, 'a finite positive SVG viewBox is required');
  const vertices = [], ids = new Set();
  let activePart = null, rootSeen = false, metadataSeen = false;
  const tags = /<(\/?)\s*([a-zA-Z][\w:-]*)\b([^>]*)>/g;
  let match;
  while ((match = tags.exec(source))) {
    const [, closing, tag, raw] = match;
    if (closing) { if (tag === 'g') activePart = null; continue; }
    if (!['svg', 'metadata', 'g', 'polygon', 'ellipse', 'line'].includes(tag)) fail(file, `unsupported SVG element <${tag}>`);
    const attrs = attributes(raw, file);
    const allowed = {
      svg: ['xmlns', 'width', 'height', 'viewBox'], metadata: ['id'], g: ['id'],
      polygon: ['id', 'points', 'fill', 'fill-opacity'],
      ellipse: ['id', 'cx', 'cy', 'rx', 'ry', 'fill', 'fill-opacity'],
      line: ['id', 'x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-opacity', 'stroke-width', 'stroke-linecap'],
    }[tag];
    for (const name of Object.keys(attrs)) if (!allowed.includes(name)) fail(file, `unsupported ${tag} attribute ${name}`);
    if (tag === 'svg') { if (rootSeen) fail(file, 'nested svg roots are unsupported'); rootSeen = true; continue; }
    if (tag === 'metadata') { metadataSeen = true; continue; }
    if (tag === 'g') {
      if (activePart !== null) fail(file, 'nested groups are unsupported');
      if (!partIndices.has(attrs.id)) fail(file, `group ${attrs.id ?? '(no id)'} is not a metadata part`);
      if (attrs.transform) fail(file, 'group transforms must be authored as clip part poses');
      activePart = attrs.id;
      if (/\/>$/.test(match[0])) activePart = null;
      continue;
    }
    if (tag === 'metadata') continue;
    if (activePart === null) fail(file, `painted <${tag}> must belong to a part group`);
    if (!attrs.id || ids.has(attrs.id)) fail(file, 'every painted shape needs a unique id');
    ids.add(attrs.id);
    const part = partIndices.get(activePart);
    if (tag === 'polygon') {
      const rawPoints = attrs.points?.trim().split(/[\s,]+/).map(Number);
      if (!rawPoints || rawPoints.length < 6 || rawPoints.length % 2 || rawPoints.some(value => !Number.isFinite(value))) fail(file, `invalid polygon ${attrs.id}`);
      const points = Array.from({ length: rawPoints.length / 2 }, (_, index) => [rawPoints[index * 2], rawPoints[index * 2 + 1]]);
      appendPolygon(vertices, points, rgba(attrs.fill, attrs['fill-opacity'], file), part);
    } else if (tag === 'ellipse') {
      appendEllipse(vertices, number(attrs.cx ?? '0', 'cx', file), number(attrs.cy ?? '0', 'cy', file),
        number(attrs.rx, 'rx', file), number(attrs.ry, 'ry', file), rgba(attrs.fill, attrs['fill-opacity'], file), part);
    } else if (tag === 'line') {
      if (attrs['stroke-linecap'] !== 'round') fail(file, 'line elements must explicitly use round stroke-linecaps');
      appendLine(vertices, number(attrs.x1, 'x1', file), number(attrs.y1, 'y1', file), number(attrs.x2, 'x2', file),
        number(attrs.y2, 'y2', file), number(attrs['stroke-width'], 'stroke-width', file), rgba(attrs.stroke, attrs['stroke-opacity'], file), part);
    }
  }
  if (!rootSeen || !metadataSeen || activePart !== null) fail(file, 'malformed SVG root, metadata, or part group');
  if (!vertices.length || vertices.length % 33) fail(file, 'SVG produced no complete painted triangles');
  for (const part of metadata.parts) if (part.parent !== null && !partIndices.has(part.parent)) fail(file, `unknown parent for ${part.id}`);
  for (const [name, expression] of Object.entries(metadata.expressions ?? {})) {
    if (!name || [...(expression.show ?? []), ...(expression.hide ?? [])].some(id => !partIndices.has(id))) fail(file, `expression ${name} references an unknown part`);
  }
  for (const [name, clip] of Object.entries(metadata.clips ?? {})) {
    if (!name || !Number.isFinite(clip.durationMs) || clip.durationMs <= 0 || !['once', 'repeat', 'alternate'].includes(clip.loop) || !Array.isArray(clip.keyframes) || clip.keyframes.length < 2) fail(file, `invalid clip ${name}`);
    let last = -1;
    for (const frame of clip.keyframes) {
      if (!Number.isFinite(frame.timeMs) || frame.timeMs <= last || frame.timeMs > clip.durationMs) fail(file, `clip ${name} keyframes must increase within duration`);
      last = frame.timeMs;
      for (const [part, pose] of Object.entries(frame.parts ?? {})) {
        if (!partIndices.has(part) || Object.values(pose).some(value => !Number.isFinite(value))) fail(file, `clip ${name} has invalid pose data`);
      }
    }
  }
  return {
    schemaVersion: 1,
    compilerVersion: '0.1.0',
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    sourcePath: path.relative(root, file).replaceAll('\\', '/'),
    metadata,
    viewBox,
    geometry: { vertices: new Float32Array(vertices), strideFloats: 11, partCount: metadata.parts.length, morphCount: 0 },
  };
}
function jsValue(value) {
  if (value instanceof Float32Array) {
    const b64 = Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('base64');
    return `(()=>{const b=atob(${JSON.stringify(b64)}),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new Float32Array(u.buffer)})()`;
  }
  if (Array.isArray(value)) return `[${value.map(jsValue).join(',')}]`;
  if (value && typeof value === 'object') return `Object.freeze({${Object.entries(value).map(([key, child]) => `${JSON.stringify(key)}:${jsValue(child)}`).join(',')}})`;
  return JSON.stringify(value) ?? 'null';
}

const files = [];
for (const source of sourceRoots) {
  const names = (await readdir(source.directory).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error)))
    .filter(name => name.endsWith('.svg')).sort();
  for (const name of names) files.push({ key: source.prefix + path.basename(name, '.svg'), file: path.join(source.directory, name) });
}
if (!files.length) throw new Error('No SVG vector sources found');
const compiled = [];
for (const source of files) compiled.push([source.key, compileSvg(await readFile(source.file), source.file)]);
const output = [
  '// Generated by scripts/compile-vector-assets.mjs from assets/vector/actors/*.svg; do not edit.',
  `export const VECTOR_ASSETS = Object.freeze({${compiled.map(([id, asset]) => `${JSON.stringify(id)}:${jsValue(asset)}`).join(',')}});`,
  '',
].join('\n');
if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== output) throw new Error('vector-assets.generated.js is stale; run node scripts/compile-vector-assets.mjs');
} else await writeFile(outputPath, output, 'utf8');
console.log(JSON.stringify({ sourceCount: files.length, actorCount: files.filter(source => !source.key.startsWith('egg-')).length,
  eggCount: files.filter(source => source.key.startsWith('egg-')).length,
  triangleCount: compiled.reduce((sum, [, asset]) => sum + asset.geometry.vertices.length / 33, 0), outputBytes: Buffer.byteLength(output), check: process.argv.includes('--check') }));
