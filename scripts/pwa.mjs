// PWA 생성: `node scripts/pwa.mjs`로 manifest·아이콘·공유 이미지·sw.js·<head> 태그를 만들고 결과를 커밋한다.
// `node scripts/pwa.mjs --check`는 아무것도 쓰지 않고, 커밋된 결과가 원본과 다르면 실패한다.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// GameKit dist fcd3a02(SDK 0.39.1)의 pwa-build.mjs 사본. 다른 바이트면 실행하지 않는다.
const PWA_BUILD = new URL('./vendor/gamekit/pwa-build.mjs', import.meta.url);
const PWA_BUILD_SHA256 = 'dc00f87aa0194ec9721b1949888c310c219238fb9c2562704300d3cbd0003858';
const ACTUAL = createHash('sha256').update(await readFile(PWA_BUILD)).digest('hex');
if (ACTUAL !== PWA_BUILD_SHA256) {
    throw new Error(`scripts/vendor/gamekit/pwa-build.mjs sha256 ${ACTUAL} does not match the pinned ${PWA_BUILD_SHA256}`);
}
const { buildPwa } = await import(PWA_BUILD.href);

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const RESULT = await buildPwa({
    chromium,
    name: 'BOUNKO · 바운코',
    shortName: '바운코',
    description: '방향을 조준해 돌진하고, 충돌과 반발력으로 싸우는 탑다운 액션 게임입니다.',
    lang: 'ko',
    icon: 'assets/pwa/icon.svg',
    maskableIcon: 'assets/pwa/icon-maskable.svg',
    share: 'assets/pwa/share.svg',
    themeColor: '#0b141a',
    backgroundColor: '#0a141a',
    startUrl: './',
    scope: './',
    siteUrl: 'https://byh-playground.github.io/bloom-bounko/',
    html: 'index.html',
    // Pages 워크플로가 배포하는 시작 파일 전부(index.html·src·루트 게임 모듈·SVG 원본·문구).
    // 루트는 `*.js`로 고르지 않는다: 생성된 sw.js가 들어가면 생성기가 거부한다.
    precache: [
        'index.html',
        'src/**',
        ...[
            'abilities', 'audio', 'controllers', 'drops', 'enemies', 'i18n', 'pets', 'player-presentation',
            'presentation-view', 'preview', 'tech-view', 'theme-progress', 'ultimates', 'vector-actors',
            'vector-assets-runtime', 'vector-assets.manifest',
        ].map((name) => `${name}.js`),
        'assets/vector/**',
        'locales/*.js',
    ],
    out: '.',
    check: process.argv.includes('--check'),
});
console.log(`pwa: ${RESULT.changed.length ? 'wrote ' + RESULT.changed.join(', ') : 'up to date'} (${RESULT.files.length} files)`);
