import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const OUT = resolve('artifacts/runtime-diagnostics');
const BASELINE_ROOT = process.env.BASELINE_ROOT ? resolve(process.env.BASELINE_ROOT) : null;
const evidence = {
  test: 'single Chromium user flow: real tick-58 launch, global errors, loop stop, restart, mobile manual copy',
  startedAt: new Date().toISOString(),
  timeBudgetMs: 150_000,
  baseline: null,
  candidate: null,
  errors: [],
  screenshots: [],
};
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
};

await mkdir(OUT, { recursive: true });
const hardStop = setTimeout(() => {
  evidence.failure = 'Runtime regression flow exceeded its 150-second functional budget.';
  evidence.finishedAt = new Date().toISOString();
  writeFileSync(resolve(OUT, 'runtime-regression.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.error(evidence.failure);
  process.exit(1);
}, evidence.timeBudgetMs);
hardStop.unref();

function serve(root) {
  const base = resolve(root);
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = resolve(base, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (file !== base && !file.startsWith(base + sep)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Not a file');
      const bytes = await readFile(file);
      res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(bytes);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  return new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolveListen({ server, url: `http://127.0.0.1:${address.port}/` });
    });
  });
}

async function boot(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__bloomImpulse && document.querySelector('#load')?.classList.contains('hidden'), null, { timeout: 25_000 });
  assert.equal(await page.locator('#fatalError').isVisible(), false, 'the game should boot without a fatal runtime dialog');
  return page.evaluate(() => ({ version: window.__bloomImpulse.VERSION, buildId: window.__bloomImpulse.BUILD_ID }));
}

async function startRun(page) {
  await page.locator('#startRun').click();
  await page.locator('#themeStartPanel').waitFor({ state: 'visible' });
  await page.locator('#themeStartList button:not([disabled])').first().click();
  await page.waitForFunction(() => {
    const state = window.__bloomImpulse?.getState();
    return state?.phase === 'PLAYING' && state.tick > 1;
  });
}

async function snapshot(page) {
  return page.evaluate(() => window.__bloomImpulse.getState());
}

async function waitForFatal(page) {
  await page.waitForFunction(() => document.querySelector('#fatalError')?.hidden === false, null, { timeout: 8_000 });
  return page.locator('#fatalErrorReport').inputValue();
}

async function reloadAndBoot(page) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('#fatalErrorReload').click(),
  ]);
  await page.waitForFunction(() => window.__bloomImpulse && document.querySelector('#load')?.classList.contains('hidden'), null, { timeout: 25_000 });
  const version = await page.evaluate(() => ({ version: window.__bloomImpulse.VERSION, buildId: window.__bloomImpulse.BUILD_ID }));
  assert.equal(await page.locator('#fatalError').isVisible(), false, 'reload should return to an interactive clean lobby');
  return version;
}

let server, baselineServer, browser;
try {
  server = await serve(process.cwd());
  if (BASELINE_ROOT) baselineServer = await serve(BASELINE_ROOT);
  browser = await chromium.launch({ headless: true });

  if (baselineServer) {
    const baselineContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const baselinePage = await baselineContext.newPage();
    evidence.baseline = await boot(baselinePage, baselineServer.url);
    await startRun(baselinePage);
    await baselinePage.waitForFunction(() => window.__bloomImpulse.getState().tick >= 45);
    const baselineState = await snapshot(baselinePage);
    assert.ok(baselineState.enemyStates.length > 0, 'baseline screenshot should contain live enemies');
    assert.equal(baselineState.rendererState, 'ready', 'baseline WebGL renderer should be ready');
    assert.ok(baselineState.vectorRendererState.meshes > 0, 'baseline vector assets should be present');
    await baselinePage.screenshot({ path: resolve(OUT, 'baseline-gameplay.png') });
    evidence.screenshots.push('baseline-gameplay.png');
    evidence.baseline.gameplay = {
      tick: baselineState.tick,
      phase: baselineState.phase,
      enemyCount: baselineState.enemyStates.length,
      theme: baselineState.stage.theme,
      renderer: baselineState.rendererState,
      vectorMeshes: baselineState.vectorRendererState.meshes,
      vectorActors: baselineState.vectorRendererState.players,
    };
    await baselineContext.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const unexpectedPageErrors = [];
  page.on('pageerror', error => unexpectedPageErrors.push(error.message));
  const candidateVersion = await boot(page, server.url);
  evidence.candidate = { ...candidateVersion, sdkCommit: '0d4e4fd270b036340d453553896b8d670b993bba', sdkVersion: '0.10.1' };
  assert.equal(candidateVersion.version, '0.23.6');
  await startRun(page);

  // Queue a real UI input at tick 52. The following fixed tick starts the 80 ms
  // alignment; creation and capture then meet at tick 58 (966.666... ms).
  const inputTick = await page.evaluate(() => {
    const engine = window.Matter.Engine;
    const update = engine.update;
    let queuedAt = null;
    engine.update = function queueBoundaryInput(...args) {
      const tick = window.__bloomImpulse.getState().tick;
      if (queuedAt === null && tick >= 52) {
        queuedAt = tick;
        engine.update = update;
        document.querySelector('#auto').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0 }));
      }
      return update.apply(this, args);
    };
    return new Promise((resolveInput, rejectInput) => {
      const started = performance.now();
      const observe = () => {
        const tick = window.__bloomImpulse.getState().tick;
        if (queuedAt !== null) resolveInput(queuedAt);
        else if (tick > 52 || performance.now() - started > 8000) rejectInput(new Error(`Could not queue gameplay UI input at tick 52 (current tick ${tick})`));
        else requestAnimationFrame(observe);
      };
      observe();
    });
  });
  assert.equal(inputTick, 52, `UI input should be queued at tick 52, observed tick ${inputTick}`);
  await page.waitForFunction(() => {
    const state = window.__bloomImpulse?.getState();
    return document.querySelector('#fatalError')?.hidden === false || state?.launchCount > 0;
  }, null, { timeout: 8_000 });
  assert.equal(await page.locator('#fatalError').isVisible(), false, 'tick-58 launch must not stop the game');
  const launchState = await snapshot(page);
  assert.ok(launchState.tick >= 58, `launch should have occurred by tick 58, observed tick ${launchState.tick}`);
  assert.equal(launchState.launchCount, 1, 'the gameplay input should create exactly one shadow');
  assert.equal(launchState.shadow.launchedAtMs, 58 * (1000 / 60), 'launch timestamp should preserve the tick-derived double');
  await page.waitForFunction(() => window.__bloomImpulse.getState().tick >= 63);
  const candidateState = await snapshot(page);
  assert.equal(candidateState.phase, 'PLAYING');
  assert.equal(candidateState.rendererState, 'ready');
  assert.ok(candidateState.enemyStates.length > 0, 'candidate gameplay screenshot should contain live enemies');
  assert.ok(candidateState.vectorRendererState.meshes > 0, 'candidate vector meshes should remain loaded');
  assert.ok(candidateState.vectorRendererState.players > 0, 'candidate should retain rendered actors');
  await page.screenshot({ path: resolve(OUT, 'candidate-gameplay-after-launch.png') });
  evidence.screenshots.push('candidate-gameplay-after-launch.png');
  evidence.candidate.gameplay = {
    tick: candidateState.tick,
    launchTick: launchState.tick,
    launchTimeMs: launchState.shadow.launchedAtMs,
    enemyCount: candidateState.enemyStates.length,
    theme: candidateState.stage.theme,
    renderer: candidateState.rendererState,
    vectorMeshes: candidateState.vectorRendererState.meshes,
    vectorActors: candidateState.vectorRendererState.players,
  };
  if (evidence.baseline?.gameplay) {
    evidence.visualReview = {
      method: 'paired screenshots for human review; no pixel-hash equality asserted',
      baselineFeatures: evidence.baseline.gameplay,
      candidateFeatures: evidence.candidate.gameplay,
      checkedFeatures: ['live enemy fill/actor meshes', 'stage background/theme remains visible', 'post-launch particle/shadow effects in candidate screenshot'],
    };
  }

  // Inject a real unhandled window error. Check a stopped run, mobile layout,
  // and clipboard-denied manual-selection fallback before reloading.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => setTimeout(() => { throw new Error('E2E_GLOBAL_ERROR_INJECTED'); }, 0));
  const globalReport = await waitForFatal(page);
  assert.ok(globalReport.length > 0, 'global exception should produce a diagnostic report');
  assert.match(globalReport, /E2E_GLOBAL_ERROR_INJECTED|Runtime state at failure|game-state/, 'global report should identify or contextualize the injected error');
  const mobileLayout = await page.evaluate(() => {
    const actions = [...document.querySelectorAll('#fatalErrorCopy,#fatalErrorReload')].map(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
    });
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      reportWidth: document.querySelector('#fatalErrorReport').getBoundingClientRect().width,
      actions,
    };
  });
  assert.ok(mobileLayout.documentWidth <= mobileLayout.viewportWidth, 'mobile error screen must not overflow horizontally');
  assert.ok(mobileLayout.actions.every(box => box.left >= 0 && box.right <= mobileLayout.viewportWidth && box.height >= 44), 'mobile error actions must remain visible and tappable');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('clipboard blocked for fallback test')) } }));
  await page.locator('#fatalErrorCopy').click();
  await page.waitForFunction(() => document.querySelector('#fatalErrorCopyStatus')?.textContent?.length > 0);
  const copyEvidence = await page.evaluate(() => ({
    status: document.querySelector('#fatalErrorCopyStatus').textContent,
    selectedLength: document.querySelector('#fatalErrorReport').selectionEnd - document.querySelector('#fatalErrorReport').selectionStart,
  }));
  assert.ok(copyEvidence.selectedLength > 0, 'blocked mobile clipboard should select the report for manual copy');
  assert.match(copyEvidence.status, /select|copy|선택|복사/i, 'copy fallback should explain the manual copy path');
  await page.screenshot({ path: resolve(OUT, 'mobile-runtime-error-manual-copy.png') });
  evidence.screenshots.push('mobile-runtime-error-manual-copy.png');
  evidence.errors.push({ kind: 'global-error', reportBytes: Buffer.byteLength(globalReport), mobileLayout, copyEvidence });

  let restarted = await reloadAndBoot(page);
  await startRun(page);
  assert.equal((await page.evaluate(() => window.__bloomImpulse.getState().phase)), 'PLAYING', 'reload should permit a new gameplay run');

  // Promise rejection uses the other global diagnostic listener.
  await page.evaluate(() => { void Promise.reject(new Error('E2E_PROMISE_REJECTION_INJECTED')); });
  const rejectionReport = await waitForFatal(page);
  assert.ok(rejectionReport.length > 0, 'unhandled rejection should produce a diagnostic report');
  evidence.errors.push({ kind: 'unhandledrejection', reportBytes: Buffer.byteLength(rejectionReport) });
  restarted = await reloadAndBoot(page);
  await startRun(page);

  // Make the actual simulation tick throw once. GameKit's loop onError handler
  // must stop the loop and release gameplay input instead of leaving it live.
  await page.evaluate(() => {
    const engine = window.Matter.Engine;
    const original = engine.update;
    engine.update = function injectedOneShotFailure(...args) {
      engine.update = original;
      throw new Error('E2E_GAME_LOOP_ERROR_INJECTED');
    };
  });
  const loopReport = await waitForFatal(page);
  assert.ok(loopReport.length > 0, 'loop exception should produce a diagnostic report');
  assert.match(loopReport, /E2E_GAME_LOOP_ERROR_INJECTED|game-loop-exception|phase=/, 'loop report should include the error or loop context');
  const stoppedTick = (await snapshot(page)).tick;
  await page.waitForTimeout(250);
  assert.equal((await snapshot(page)).tick, stoppedTick, 'simulation tick must remain stopped after a loop exception');
  evidence.errors.push({ kind: 'game-loop-exception', stoppedTick, reportBytes: Buffer.byteLength(loopReport) });
  restarted = await reloadAndBoot(page);
  await startRun(page);
  const restartState = await snapshot(page);
  assert.equal(restartState.phase, 'PLAYING', 'reload after a loop failure should start a fresh playable run');
  assert.ok(restartState.tick > 0);
  evidence.restart = { version: restarted.version, buildId: restarted.buildId, phase: restartState.phase, tick: restartState.tick };
  assert.deepEqual(unexpectedPageErrors.filter(message => !/E2E_GLOBAL_ERROR_INJECTED|E2E_PROMISE_REJECTION_INJECTED/.test(message)), [], 'unexpected uncaught page errors should be absent');
  await context.close();
} catch (error) {
  evidence.failure = `${error?.stack || error}`;
  throw error;
} finally {
  clearTimeout(hardStop);
  evidence.finishedAt = new Date().toISOString();
  await writeFile(resolve(OUT, 'runtime-regression.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  await browser?.close();
  if (server) await new Promise(resolveClose => server.server.close(resolveClose));
  if (baselineServer) await new Promise(resolveClose => baselineServer.server.close(resolveClose));
}
