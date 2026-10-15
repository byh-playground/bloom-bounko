// Visual state only. SVG clips and expressions own every authored player pose.
// This module maps gameplay-facing intent to those names and stores their start times.
const DIRECTIONS = Object.freeze(['north', 'east', 'south', 'west']);

function directionName(direction, fallback = 'north') {
  const x = direction?.x ?? 0, y = direction?.y ?? 0;
  if (Math.hypot(x, y) < 1e-5) return fallback;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'east' : 'west';
  return y > 0 ? 'south' : 'north';
}

export function createPlayerPresentation() {
  return { clip: 'idle', clipAtMs: 0, direction: 'north', expression: 'face-north',
    rollAtMs: -Infinity, rollDurationMs: 220, rollSign: 1, hitAtMs: -Infinity };
}

export function facePlayer(presentation, direction) {
  presentation.direction = directionName(direction, presentation.direction);
}

export function rollPlayer(presentation, direction, nowMs, durationMs) {
  facePlayer(presentation, direction);
  presentation.rollAtMs = nowMs;
  presentation.rollDurationMs = Math.min(260, durationMs);
  presentation.rollSign = direction?.x < 0 ? -1 : 1;
  presentation.clip = presentation.rollSign < 0 ? 'roll-reverse' : 'roll';
  presentation.clipAtMs = nowMs;
}

export function impactPlayer(presentation, direction, speed, nowMs) {
  if (speed < 80 || nowMs - presentation.hitAtMs < 130) return;
  presentation.hitAtMs = nowMs;
  facePlayer(presentation, direction);
  presentation.clip = 'hit';
  presentation.clipAtMs = nowMs;
}

export function updatePlayerPresentation(presentation, { nowMs, direction, dash = null, recoil = null, compression = 0 }) {
  facePlayer(presentation, direction ?? dash?.direction ?? recoil?.direction);
  const rollActive = nowMs >= presentation.rollAtMs && nowMs < presentation.rollAtMs + presentation.rollDurationMs;
  const hitActive = nowMs >= presentation.hitAtMs && nowMs < presentation.hitAtMs + 210;
  let clip = 'idle';
  if (rollActive) clip = presentation.rollSign < 0 ? 'roll-reverse' : 'roll';
  else if (dash) clip = `dash-${presentation.direction}`;
  else if (hitActive || recoil) clip = `hit-${presentation.direction}`;
  else if (compression > 1e-3) clip = 'charge';
  if (clip !== presentation.clip) {
    presentation.clip = clip;
    presentation.clipAtMs = nowMs;
  }
  presentation.expression = `face-${presentation.direction}`;
}

export function playerVectorState(presentation, displayTimeMs) {
  return {
    clip: presentation.clip,
    clipAtMs: Number.isFinite(presentation.clipAtMs) ? presentation.clipAtMs : displayTimeMs,
    expression: presentation.expression && DIRECTIONS.some(direction => presentation.expression === `face-${direction}`)
      ? presentation.expression : 'face-north',
  };
}
