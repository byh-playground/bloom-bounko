// bloom-gamekit pwa가 생성한 파일입니다. 직접 고치지 말고 생성 스크립트를 다시 실행하세요.
(function serviceWorker(config) {
  const SCOPE = self.registration.scope;
  const PREFIX = `bloom-pwa:${new URL(SCOPE).pathname}:`;
  const CACHE = PREFIX + config.version;
  const RUNTIME = PREFIX + "gamekit";
  const GAMEKIT = new RegExp(config.gamekit);
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE).then(
        (cache) => cache.addAll(
          config.precache.map(
            (url) => GAMEKIT.test(url) ? new Request(url, { mode: "cors" }) : new Request(url, { cache: "reload" })
          )
        )
      )
    );
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then(
        (keys) => Promise.all(
          keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE && key !== RUNTIME).map((key) => caches.delete(key))
        )
      ).then(() => self.clients.claim())
    );
  });
  self.addEventListener("message", (event) => {
    if (event.data?.type === config.activateMessage) {
      self.skipWaiting();
    }
  });
  async function sameOrigin(request) {
    const STORE = await caches.open(CACHE);
    const NAVIGATE = request.mode === "navigate";
    let response = await STORE.match(request, { ignoreSearch: NAVIGATE });
    const ADDRESS = new URL(request.url);
    if (!response && NAVIGATE && ADDRESS.pathname.endsWith("/")) {
      response = await STORE.match(new URL("index.html", ADDRESS).href);
    }
    return response ?? fetch(request);
  }
  async function gamekit(request) {
    const CACHED = await caches.match(request);
    if (CACHED) {
      return CACHED;
    }
    const RESPONSE = await fetch(request);
    if (RESPONSE.ok) {
      const STORE = await caches.open(RUNTIME);
      await STORE.put(request, RESPONSE.clone());
    }
    return RESPONSE;
  }
  self.addEventListener("fetch", (event) => {
    const REQUEST = event.request;
    if (REQUEST.method !== "GET") {
      return;
    }
    if (new URL(REQUEST.url).origin === self.location.origin) {
      event.respondWith(sameOrigin(REQUEST));
    } else if (GAMEKIT.test(REQUEST.url)) {
      event.respondWith(gamekit(REQUEST));
    }
  });
})({
    "version": "f87d65a7c13778a9",
    "activateMessage": "bloom-pwa:activate",
    "gamekit": "^https:\\/\\/cdn\\.jsdelivr\\.net\\/gh\\/byh-playground\\/bloom-gamekit@[0-9a-f]{40}\\/[A-Za-z0-9._/-]+$",
    "precache": [
        "abilities.js",
        "assets/vector/actors/brute.svg",
        "assets/vector/actors/carriermite.svg",
        "assets/vector/actors/clawhunter.svg",
        "assets/vector/actors/dandelion.svg",
        "assets/vector/actors/deathworm.svg",
        "assets/vector/actors/deepthorn.svg",
        "assets/vector/actors/elasticCap.svg",
        "assets/vector/actors/fireant.svg",
        "assets/vector/actors/hivecarrier.svg",
        "assets/vector/actors/lancer.svg",
        "assets/vector/actors/medic.svg",
        "assets/vector/actors/petalPredator.svg",
        "assets/vector/actors/pikeman.svg",
        "assets/vector/actors/pillbug.svg",
        "assets/vector/actors/player.svg",
        "assets/vector/actors/puff.svg",
        "assets/vector/actors/rocket.svg",
        "assets/vector/actors/rogue.svg",
        "assets/vector/actors/rootstalker.svg",
        "assets/vector/actors/scout.svg",
        "assets/vector/actors/spitter.svg",
        "assets/vector/actors/sporemoth.svg",
        "assets/vector/actors/sprout.svg",
        "assets/vector/actors/swordsman.svg",
        "assets/vector/actors/thornfruit.svg",
        "assets/vector/eggs/brute.svg",
        "assets/vector/eggs/carriermite.svg",
        "assets/vector/eggs/clawhunter.svg",
        "assets/vector/eggs/dandelion.svg",
        "assets/vector/eggs/deathworm.svg",
        "assets/vector/eggs/deepthorn.svg",
        "assets/vector/eggs/elasticCap.svg",
        "assets/vector/eggs/fireant.svg",
        "assets/vector/eggs/hivecarrier.svg",
        "assets/vector/eggs/lancer.svg",
        "assets/vector/eggs/medic.svg",
        "assets/vector/eggs/petalPredator.svg",
        "assets/vector/eggs/pikeman.svg",
        "assets/vector/eggs/pillbug.svg",
        "assets/vector/eggs/puff.svg",
        "assets/vector/eggs/rocket.svg",
        "assets/vector/eggs/rogue.svg",
        "assets/vector/eggs/rootstalker.svg",
        "assets/vector/eggs/scout.svg",
        "assets/vector/eggs/spitter.svg",
        "assets/vector/eggs/sporemoth.svg",
        "assets/vector/eggs/sprout.svg",
        "assets/vector/eggs/swordsman.svg",
        "assets/vector/eggs/thornfruit.svg",
        "audio.js",
        "controllers.js",
        "drops.js",
        "enemies.js",
        "i18n.js",
        "index.html",
        "locales/en.js",
        "locales/ko.js",
        "manifest.webmanifest",
        "pets.js",
        "player-presentation.js",
        "presentation-view.js",
        "preview.js",
        "pwa/apple-touch-icon.png",
        "pwa/icon-192.png",
        "pwa/icon-512.png",
        "pwa/maskable-512.png",
        "src/main.js",
        "src/styles/main.css",
        "tech-view.js",
        "theme-progress.js",
        "ultimates.js",
        "vector-actors.js",
        "vector-assets-runtime.js",
        "vector-assets.manifest.js",
        "https://cdn.jsdelivr.net/gh/byh-playground/bloom-gamekit@fcd3a02db452b2e469898b05aa797d754a89fb76/audio.js",
        "https://cdn.jsdelivr.net/gh/byh-playground/bloom-gamekit@fcd3a02db452b2e469898b05aa797d754a89fb76/debug-tools.js",
        "https://cdn.jsdelivr.net/gh/byh-playground/bloom-gamekit@fcd3a02db452b2e469898b05aa797d754a89fb76/vector-assets-loader.js"
    ]
});
