// Compiled SVGs are shared by every actor of the same asset on one VectorContext. The context owns
// painter order between vector paint and actors, so this module never flushes by hand.
export function createVectorActors({ context, createVectorActor, compiledAssets }) {
  const assets = new Map(Object.entries(compiledAssets));
  const players = new Map();
  const directionalActors = new Set(['lancer', 'swordsman', 'pikeman', 'sporemoth', 'fireant', 'clawhunter', 'hivecarrier', 'carriermite']);
  let visible = new Set();

  function asset(id) {
    const value = assets.get(id);
    if (!value) throw new Error(`Missing SVG vector asset: ${id}`);
    return value;
  }
  function playerFor(key, id, timeMs) {
    let record = players.get(key);
    if (record && record.id !== id) {
      record.actor.dispose();
      players.delete(key);
      record = null;
    }
    if (!record) {
      const vector = asset(id);
      record = { id, actor: createVectorActor(context, vector, { clip: Object.keys(vector.metadata.clips)[0], startedAtMs: timeMs }), clip: null, expression: null };
      players.set(key, record);
    }
    visible.add(key);
    return record;
  }
  function setPose(record, clip, expression, timeMs) {
    if (record.clip !== clip) {
      if (record.clip === null) record.actor.play(clip, timeMs);
      else record.actor.transitionTo(clip, timeMs, 65);
      record.clip = clip;
    } else record.actor.seek(timeMs);
    if (record.expression !== expression) {
      record.actor.setExpression(expression);
      record.expression = expression;
    }
  }
  function drawMesh(record, matrix, { alpha = 1 } = {}) {
    context.drawVectorActor(record.actor, { matrix, alpha });
  }
  function colorFromHex(value) {
    if (!/^#[\da-f]{6}$/i.test(value ?? '')) return [1, 1, 1, 1];
    return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16) / 255).concat(1);
  }
  function outlinePasses(outline) {
    if (!outline || !Number.isFinite(outline.width) || outline.width <= 0) return [];
    const primary = { width: outline.width, color: colorFromHex(outline.color) }, output = [primary];
    const contrast = outline.contrast;
    if (contrast && Number.isFinite(contrast.width) && contrast.width > 0) {
      const color = colorFromHex(contrast.color);
      const distance = Math.hypot(...primary.color.slice(0, 3).map((value, index) => value - color[index]));
      if (distance < (contrast.maxColorDistance ?? 0)) output.push({ width: contrast.width, color });
    }
    return output;
  }
  function drawOutlined(record, expression, matrix, outline, alpha) {
    const passes = outlinePasses(outline);
    if (!passes.length) return drawMesh(record, matrix, { alpha });
    record.actor.setExpression('outline');
    record.expression = 'outline';
    for (const pass of passes) {
      for (let index = 0; index < 8; index++) {
        const angle = index * Math.PI / 4, drawMatrix = matrix.slice();
        drawMatrix[4] += Math.cos(angle) * pass.width;
        drawMatrix[5] += Math.sin(angle) * pass.width;
        context.drawVectorActor(record.actor, { matrix: drawMatrix, alpha, color: pass.color, forceColor: true });
      }
    }
    record.actor.setExpression(expression);
    record.expression = expression;
    return drawMesh(record, matrix, { alpha });
  }
  function actorState(state, attacking, boss) {
    if (boss && (state === 'BOSS_WINDUP' || state === 'BOSS_LOCK')) return { clip: 'windup', expression: 'windup' };
    if (boss && state === 'BOSS_CHARGE') return { clip: 'attack', expression: 'charge' };
    if (attacking) return { clip: /PREPARE|WINDUP|LOCK/.test(state ?? '') ? 'windup' : 'attack', expression: boss ? 'neutral' : 'attack' };
    return { clip: 'idle', expression: 'neutral' };
  }

  function beginFrame() {
    visible = new Set();
  }
  function drawActor({ key, assetId, x, y, radius, timeMs, unit = null, attacking = false, expression = null,
    alpha = 1, scaleX = 1, scaleY = 1, outline = null }) {
    const vector = asset(assetId), record = playerFor(`actor:${key}`, assetId, timeMs);
    const boss = assetId === 'petalPredator' || assetId === 'elasticCap';
    const state = expression ? { clip: unit?.state === 'BOSS_CHARGE' ? 'attack' : 'idle', expression }
      : actorState(unit?.state, attacking, boss);
    setPose(record, state.clip, state.expression, timeMs);
    const angle = directionalActors.has(assetId) && unit
      ? Math.atan2(unit.headingY ?? -1, unit.headingX ?? 0) + Math.PI / 2 : 0;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    const matrix = [cosine * radius * scaleX, sine * radius * scaleX, -sine * radius * scaleY,
      cosine * radius * scaleY, x, y];
    drawOutlined(record, state.expression, matrix, outline, alpha);
  }
  function drawPlayer({ x, y, timeMs, state, health = 1 }) {
    const record = playerFor('actor:player', 'player', timeMs);
    const expression = health <= .25 ? state.expression.replace(/^face-/, 'hurt-') : state.expression;
    setPose(record, state.clip, expression, timeMs);
    drawMesh(record, [1, 0, 0, 1, x, y]);
  }
  function drawEgg({ key, speciesId, x, y, radius, timeMs, progress = 0, alpha = 1 }) {
    const id = `egg-${speciesId}`, record = playerFor(`egg:${key}`, id, timeMs);
    const expression = progress > .6 ? 'hatched' : progress > .3 ? 'cracked' : 'closed';
    const clip = progress > .3 ? 'hatch' : 'idle';
    setPose(record, clip, expression, timeMs);
    drawMesh(record, [radius, 0, 0, radius, x, y], { alpha });
  }
  function endFrame() {
    for (const [key, record] of players) if (!visible.has(key)) {
      record.actor.dispose();
      players.delete(key);
    }
  }
  function dispose() {
    for (const record of players.values()) record.actor.dispose();
    players.clear();
  }
  return Object.freeze({ beginFrame, drawActor, drawPlayer, drawEgg, endFrame, dispose, stats: () => ({ meshes: context.stats().mesh?.meshCount ?? 0, players: players.size }) });
}
