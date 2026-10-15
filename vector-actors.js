// Vector assets are retained once per SVG and rendered in the same ordered WebGL
// context as Renderer2D. Meshes flush at the existing painter-order boundaries.
export function createVectorActors({ renderer, device, MeshRenderer, createVectorAsset, compiledAssets }) {
  const meshRenderer = new MeshRenderer(device);
  const assets = new Map(Object.entries(compiledAssets).map(([id, compiled]) => [id, createVectorAsset(meshRenderer, compiled)]));
  const players = new Map();
  const directionalActors = new Set(['lancer', 'swordsman', 'pikeman', 'sporemoth', 'fireant', 'clawhunter', 'hivecarrier', 'carriermite']);
  let active = false;
  let visible = new Set();

  function asset(id) {
    const value = assets.get(id);
    if (!value || value.disposed) throw new Error(`Missing SVG vector asset: ${id}`);
    return value;
  }
  function playerFor(key, id, timeMs) {
    let record = players.get(key);
    if (record && record.id !== id) {
      record.player.dispose();
      players.delete(key);
      record = null;
    }
    if (!record) {
      const vector = asset(id);
      record = { id, asset: vector, player: vector.createPlayer({ clip: Object.keys(vector.metadata.clips)[0], startedAtMs: timeMs }), clip: null, expression: null };
      players.set(key, record);
    }
    visible.add(key);
    return record;
  }
  function setPose(record, clip, expression, timeMs) {
    if (record.clip !== clip) {
      if (record.clip === null) record.player.play(clip, timeMs);
      else record.player.transitionTo(clip, timeMs, 65);
      record.clip = clip;
    } else record.player.seek(timeMs);
    if (record.expression !== expression) {
      record.player.setExpression(expression);
      record.expression = expression;
    }
  }
  function drawMesh(record, matrix, { alpha = 1, color = [1, 1, 1, 1], forceColor = false } = {}) {
    if (!active || device.state !== 'ready' || !device.active) return false;
    renderer.flush();
    record.player.draw({ projection: renderer.projection, matrix, alpha, color, forceColor });
    meshRenderer.flush();
    return true;
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
    if (!active || device.state !== 'ready' || !device.active) return false;
    const passes = outlinePasses(outline);
    if (!passes.length) return drawMesh(record, matrix, { alpha });
    renderer.flush();
    record.player.setExpression('outline');
    record.expression = 'outline';
    for (const pass of passes) {
      for (let index = 0; index < 8; index++) {
        const angle = index * Math.PI / 4, drawMatrix = matrix.slice();
        drawMatrix[4] += Math.cos(angle) * pass.width;
        drawMatrix[5] += Math.sin(angle) * pass.width;
        record.player.draw({ projection: renderer.projection, matrix: drawMatrix, alpha, color: pass.color, forceColor: true });
      }
    }
    // These offset draws share the same actor mesh, pose, projection, and clip;
    // their per-instance matrices/colors are queued in order and flushed together.
    meshRenderer.flush();
    record.player.setExpression(expression);
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
    try {
      active = device.beginFrame({ clearColor: [0, 0, 0, 0] });
      if (active) meshRenderer.beginFrame();
      return active;
    } catch (error) {
      // A GPU context can be lost between the state check and WebGLDevice viewport query.
      if (device.state === "lost" || renderer.state === "lost" || device.gl?.isContextLost?.() || error?.message?.includes("Cannot read properties of null (reading '0')")) {
        active = false;
        return false;
      }
      throw error;
    }
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
    if (!active) return;
    if (device.state === 'ready' && device.active) {
      meshRenderer.flush();
      device.endFrame();
    }
    active = false;
    for (const [key, record] of players) if (!visible.has(key)) {
      record.player.dispose();
      players.delete(key);
    }
  }
  function dispose() {
    for (const record of players.values()) record.player.dispose();
    players.clear();
    for (const vector of assets.values()) vector.dispose();
    assets.clear();
    meshRenderer.dispose();
    device.dispose();
    active = false;
  }
  return Object.freeze({ beginFrame, drawActor, drawPlayer, drawEgg, endFrame, dispose,
    stats: () => ({ device: device.stats, renderer: meshRenderer.stats(), meshes: meshRenderer.meshes.size, players: players.size }) });
}
