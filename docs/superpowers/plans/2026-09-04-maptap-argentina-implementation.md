# Maptap Argentina Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable web game where the player sees a club's crest/name and clicks a map of Argentina to guess its location, scored by distance, matching the spec at `docs/superpowers/specs/2026-09-04-maptap-argentina-design.md`.

**Architecture:** Static site, no build step. Pure game-logic modules (distance, scoring, round selection, best-score persistence) are unit tested with Node's built-in test runner. DOM/map code (Leaflet integration, UI rendering) is verified manually in the browser, per the spec's testing section. A single `data/clubs.json` file holds the club dataset.

**Tech Stack:** Vanilla JavaScript (ES modules, no framework), Leaflet 1.9.4 + OpenStreetMap tiles (via CDN), Node.js built-in test runner (`node --test`), `http-server` (via `npx`) for local preview.

## Global Constraints

- No framework or bundler — plain HTML/CSS/JS with native ES modules, per spec's "Arquitectura técnica".
- No backend — all persistent state is `localStorage`, per spec.
- Map library: Leaflet + OpenStreetMap tiles, loaded via CDN, no API key, per spec.
- 5 rounds per game, no repeated club within a game, per spec's "Mecánica de juego".
- Scoring: exponential decay, `score = round(5000 * e^(-distanceKm / 30))`, clipped at 0 — calibrated so a ~20km miss loses about half the points and the score is effectively 0 well before 300-400km, matching spec's "cae rápido en los primeros 15-20 km, tiende a 0 a partir de ~300-400 km".
- Dataset lives in `data/clubs.json`; `lat`/`lng` must be the club's stadium/sede, not just the city, per spec.
- Crest fallback: when a club has no `crestUrl`, render its name over its `colors`, per spec.
- Target hosting: static site deployable to Vercel/Netlify/GitHub Pages — no server-side code, per spec.
- Node.js >= 18 required (built-in test runner + stable ESM support).

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`
- Test: `tests/smoke.test.js`

**Interfaces:**
- Produces: `npm test` (runs `node --test tests/`), `npm run dev` (serves the project root at `http://localhost:8080`).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "maptap-argentina",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/",
    "dev": "npx --yes http-server -c-1 -p 8080"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
```

- [ ] **Step 3: Create `README.md`**

```markdown
# Maptap Argentina

Juego de geolocalización de clubes de fútbol y rugby argentinos, estilo
GeoGuessr/maptap.gg. Diseño completo en
`docs/superpowers/specs/2026-09-04-maptap-argentina-design.md`.

## Desarrollo

Correr los tests unitarios:

    npm test

Levantar el juego en el navegador:

    npm run dev

Abrir la URL que imprime el comando (por defecto `http://localhost:8080`).
```

- [ ] **Step 4: Create a smoke test to confirm the test runner is wired up**

```javascript
// tests/smoke.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('the test runner is wired up correctly', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 5: Run the test suite**

Run: `npm test`
Expected: 1 test passing (`the test runner is wired up correctly`).

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore README.md tests/smoke.test.js
git commit -m "chore: scaffold project with test runner and dev server"
```

---

### Task 2: Distance calculation (`geo.js`)

**Files:**
- Create: `src/geo.js`
- Test: `tests/geo.test.js`

**Interfaces:**
- Produces: `haversineDistanceKm(a: {lat: number, lng: number}, b: {lat: number, lng: number}): number` — great-circle distance in kilometers.

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/geo.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistanceKm } from '../src/geo.js';

test('distance between identical points is 0', () => {
  const point = { lat: -34.6037, lng: -58.3816 };
  assert.equal(haversineDistanceKm(point, point), 0);
});

test('distance between Buenos Aires and Córdoba is approximately 646km', () => {
  const buenosAires = { lat: -34.6037, lng: -58.3816 };
  const cordoba = { lat: -31.4201, lng: -64.1888 };
  const distance = haversineDistanceKm(buenosAires, cordoba);
  assert.ok(Math.abs(distance - 646) < 5, `expected ~646km, got ${distance}`);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/geo.test.js`
Expected: FAIL with "Cannot find module '../src/geo.js'".

- [ ] **Step 3: Implement `src/geo.js`**

```javascript
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/geo.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/geo.js tests/geo.test.js
git commit -m "feat: add haversine distance calculation"
```

---

### Task 3: Scoring curve (`scoring.js`)

**Files:**
- Create: `src/scoring.js`
- Test: `tests/scoring.test.js`

**Interfaces:**
- Produces: `scoreForDistance(distanceKm: number): number` — integer score between 0 and 5000.

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/scoring.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreForDistance } from '../src/scoring.js';

test('exact guess scores the maximum', () => {
  assert.equal(scoreForDistance(0), 5000);
});

test('a guess ~20km away loses about half the points', () => {
  const score = scoreForDistance(20);
  assert.ok(score > 2300 && score < 2700, `expected ~2500, got ${score}`);
});

test('a guess far away scores 0, never negative', () => {
  assert.equal(scoreForDistance(1000), 0);
  assert.equal(scoreForDistance(1_000_000), 0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/scoring.test.js`
Expected: FAIL with "Cannot find module '../src/scoring.js'".

- [ ] **Step 3: Implement `src/scoring.js`**

```javascript
const MAX_SCORE = 5000;
const DECAY_KM = 30;

export function scoreForDistance(distanceKm) {
  const raw = MAX_SCORE * Math.exp(-distanceKm / DECAY_KM);
  return Math.max(0, Math.round(raw));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/scoring.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/scoring.js tests/scoring.test.js
git commit -m "feat: add distance-based scoring curve"
```

---

### Task 4: Round selection (`roundPicker.js`)

**Files:**
- Create: `src/roundPicker.js`
- Test: `tests/roundPicker.test.js`

**Interfaces:**
- Produces: `pickRounds(clubs: Array<{id: string}>, count: number, rng?: () => number): Array<{id: string}>` — returns `count` unique clubs from `clubs`, shuffled using `rng` (defaults to `Math.random`). Throws `RangeError` if `count > clubs.length`.

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/roundPicker.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickRounds } from '../src/roundPicker.js';

const clubs = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));

test('with a fixed rng, produces a deterministic shuffle', () => {
  const rng = () => 0;
  const result = pickRounds(clubs, 3, rng);
  assert.deepEqual(result.map((c) => c.id), ['b', 'c', 'd']);
});

test('returns the requested count with unique ids', () => {
  const result = pickRounds(clubs, 3, Math.random);
  assert.equal(result.length, 3);
  assert.equal(new Set(result.map((c) => c.id)).size, 3);
});

test('throws when asking for more rounds than clubs available', () => {
  assert.throws(() => pickRounds(clubs, 6, Math.random), RangeError);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/roundPicker.test.js`
Expected: FAIL with "Cannot find module '../src/roundPicker.js'".

- [ ] **Step 3: Implement `src/roundPicker.js`**

```javascript
export function pickRounds(clubs, count, rng = Math.random) {
  if (count > clubs.length) {
    throw new RangeError(
      `Cannot pick ${count} rounds from ${clubs.length} clubs`
    );
  }

  const shuffled = clubs.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/roundPicker.test.js`
Expected: PASS (3 tests).

Note: the first test's expected order (`['b', 'c', 'd']`) is the exact result of a Fisher-Yates shuffle over `[a, b, c, d, e]` when `rng` always returns `0`. If a different (but still correct) shuffle implementation is used, recompute this expected value by hand rather than changing the algorithm to fit the test.

- [ ] **Step 5: Commit**

```bash
git add src/roundPicker.js tests/roundPicker.test.js
git commit -m "feat: add round selection with injectable rng"
```

---

### Task 5: Best score persistence (`bestScore.js`)

**Files:**
- Create: `src/bestScore.js`
- Test: `tests/bestScore.test.js`

**Interfaces:**
- Produces: `getBestScore(storage: {getItem, setItem}): number`, `saveBestScoreIfHigher(storage: {getItem, setItem}, score: number): number` (returns the resulting best score). `storage` matches the `localStorage` API so a fake can be injected in tests.

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/bestScore.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBestScore, saveBestScoreIfHigher } from '../src/bestScore.js';

function createFakeStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
  };
}

test('getBestScore returns 0 when nothing is stored', () => {
  const storage = createFakeStorage();
  assert.equal(getBestScore(storage), 0);
});

test('saveBestScoreIfHigher stores and returns a new higher score', () => {
  const storage = createFakeStorage();
  const result = saveBestScoreIfHigher(storage, 12000);
  assert.equal(result, 12000);
  assert.equal(getBestScore(storage), 12000);
});

test('saveBestScoreIfHigher keeps the existing score when the new one is lower', () => {
  const storage = createFakeStorage();
  saveBestScoreIfHigher(storage, 12000);
  const result = saveBestScoreIfHigher(storage, 9000);
  assert.equal(result, 12000);
  assert.equal(getBestScore(storage), 12000);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/bestScore.test.js`
Expected: FAIL with "Cannot find module '../src/bestScore.js'".

- [ ] **Step 3: Implement `src/bestScore.js`**

```javascript
const STORAGE_KEY = 'maptap-argentina-best-score';

export function getBestScore(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  const parsed = raw === null ? 0 : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveBestScoreIfHigher(storage, score) {
  const current = getBestScore(storage);
  if (score > current) {
    storage.setItem(STORAGE_KEY, String(score));
    return score;
  }
  return current;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/bestScore.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/bestScore.js tests/bestScore.test.js
git commit -m "feat: add best-score persistence with injectable storage"
```

---

### Task 6: Club dataset (`data/clubs.json`)

**Files:**
- Create: `data/clubs.json`
- Test: `tests/clubsData.test.js`

**Interfaces:**
- Produces: `data/clubs.json` — a JSON array of club objects: `{ id: string, name: string, discipline: 'futbol' | 'rugby', lat: number, lng: number, crestUrl: string | null, colors: string[] }`.

**Context:** per spec, this is a small seed dataset (not the full 40-60 clubs) meant to be expanded by hand over time. The coordinates below are a best-effort starting point, not verified GPS data — cross-check each one against a maps service before treating this dataset as authoritative. No `crestUrl` values are included in this seed set (fabricating Wikimedia URLs that might not resolve would silently break images); every seed club renders through the text/color fallback. Real crest URLs should be added club-by-club afterwards, verifying each one loads before committing it.

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/clubsData.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const clubs = JSON.parse(
  readFileSync(new URL('../data/clubs.json', import.meta.url))
);

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const ARGENTINA_LAT_RANGE = [-55, -21];
const ARGENTINA_LNG_RANGE = [-74, -53];

test('clubs.json has at least 10 entries', () => {
  assert.ok(clubs.length >= 10, `expected at least 10 clubs, got ${clubs.length}`);
});

test('every club has a valid shape', () => {
  for (const club of clubs) {
    assert.equal(typeof club.id, 'string', `${club.name}: id must be a string`);
    assert.equal(typeof club.name, 'string', `${club.id}: name must be a string`);
    assert.ok(
      club.discipline === 'futbol' || club.discipline === 'rugby',
      `${club.id}: discipline must be 'futbol' or 'rugby'`
    );
    assert.ok(
      club.lat >= ARGENTINA_LAT_RANGE[0] && club.lat <= ARGENTINA_LAT_RANGE[1],
      `${club.id}: lat out of Argentina range`
    );
    assert.ok(
      club.lng >= ARGENTINA_LNG_RANGE[0] && club.lng <= ARGENTINA_LNG_RANGE[1],
      `${club.id}: lng out of Argentina range`
    );
    if (!club.crestUrl) {
      assert.ok(
        Array.isArray(club.colors) && club.colors.length > 0,
        `${club.id}: needs a colors fallback when crestUrl is absent`
      );
      for (const color of club.colors) {
        assert.match(color, HEX_COLOR, `${club.id}: invalid color ${color}`);
      }
    }
  }
});

test('club ids are unique', () => {
  const ids = clubs.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('dataset covers both disciplines', () => {
  assert.ok(clubs.some((c) => c.discipline === 'futbol'));
  assert.ok(clubs.some((c) => c.discipline === 'rugby'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/clubsData.test.js`
Expected: FAIL with "ENOENT: no such file or directory, open '.../data/clubs.json'".

- [ ] **Step 3: Create `data/clubs.json`**

```json
[
  { "id": "boca-juniors", "name": "Club Atlético Boca Juniors", "discipline": "futbol", "lat": -34.6356, "lng": -58.3648, "crestUrl": null, "colors": ["#0b2f6b", "#f9d616"] },
  { "id": "river-plate", "name": "Club Atlético River Plate", "discipline": "futbol", "lat": -34.5453, "lng": -58.4497, "crestUrl": null, "colors": ["#e30613", "#ffffff"] },
  { "id": "san-lorenzo", "name": "Club Atlético San Lorenzo de Almagro", "discipline": "futbol", "lat": -34.6524, "lng": -58.4335, "crestUrl": null, "colors": ["#002a5c", "#e30613"] },
  { "id": "racing-club", "name": "Racing Club", "discipline": "futbol", "lat": -34.6672, "lng": -58.3618, "crestUrl": null, "colors": ["#63b0e0", "#ffffff"] },
  { "id": "independiente", "name": "Club Atlético Independiente", "discipline": "futbol", "lat": -34.6641, "lng": -58.3547, "crestUrl": null, "colors": ["#e30613", "#ffffff"] },
  { "id": "newells-old-boys", "name": "Newell's Old Boys", "discipline": "futbol", "lat": -32.9468, "lng": -60.6660, "crestUrl": null, "colors": ["#e30613", "#000000"] },
  { "id": "rosario-central", "name": "Rosario Central", "discipline": "futbol", "lat": -32.9270, "lng": -60.6280, "crestUrl": null, "colors": ["#0033a0", "#ffdd00"] },
  { "id": "talleres-cordoba", "name": "Club Atlético Talleres", "discipline": "futbol", "lat": -31.3210, "lng": -64.2296, "crestUrl": null, "colors": ["#0033a0", "#ffffff"] },
  { "id": "casi", "name": "Club Atlético San Isidro (CASI)", "discipline": "rugby", "lat": -34.4708, "lng": -58.5192, "crestUrl": null, "colors": ["#000000", "#ffffff"] },
  { "id": "sic", "name": "San Isidro Club (SIC)", "discipline": "rugby", "lat": -34.4600, "lng": -58.5300, "crestUrl": null, "colors": ["#e30613", "#ffffff"] },
  { "id": "hindu-club", "name": "Hindú Club", "discipline": "rugby", "lat": -34.4900, "lng": -58.6300, "crestUrl": null, "colors": ["#4b2e83", "#ffffff"] },
  { "id": "newman", "name": "Club Newman", "discipline": "rugby", "lat": -34.4100, "lng": -58.7100, "crestUrl": null, "colors": ["#0033a0", "#ffffff"] }
]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/clubsData.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add data/clubs.json tests/clubsData.test.js
git commit -m "feat: add seed club dataset with schema validation"
```

---

### Task 7: Page skeleton, styles, and Leaflet map view

**Files:**
- Create: `index.html`
- Create: `styles/main.css`
- Create: `src/mapView.js`
- Create: `src/main.js` (temporary click-logging harness; fully replaced in Task 9)

**Interfaces:**
- Produces: `createMapView(containerId: string): { onGuess(handler: (latlng: {lat: number, lng: number}) => void): void, showGuess(latlng: {lat: number, lng: number}): void, showResult(guessLatLng: {lat: number, lng: number}, actualLatLng: {lat: number, lng: number}): void, reset(): void }`. Depends on the global `L` (Leaflet), loaded via CDN `<script>` in `index.html` before `src/main.js`.
- Produces DOM containers by id, used by Task 9's `ui.js`: `club-crest` (img), `club-crest-fallback` (div), `club-name` (h1), `map` (div), `round-result` (section), `result-distance` (p), `result-score` (p), `next-round-button` (button), `game-summary` (section), `summary-total` (p), `summary-best` (p), `summary-breakdown` (ol), `play-again-button` (button).

This task has no automated test — Leaflet requires a real browser DOM, and the spec explicitly scopes automated tests to non-DOM code. Verification is manual, in the browser.

- [ ] **Step 1: Create `index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Maptap Argentina</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="styles/main.css" />
  </head>
  <body>
    <header id="club-prompt">
      <img id="club-crest" alt="" hidden />
      <div id="club-crest-fallback" hidden></div>
      <h1 id="club-name"></h1>
    </header>

    <div id="map"></div>

    <section id="round-result" hidden>
      <p id="result-distance"></p>
      <p id="result-score"></p>
      <button id="next-round-button" type="button">Siguiente ronda</button>
    </section>

    <section id="game-summary" hidden>
      <h2>Resumen</h2>
      <p id="summary-total"></p>
      <p id="summary-best"></p>
      <ol id="summary-breakdown"></ol>
      <button id="play-again-button" type="button">Jugar de nuevo</button>
    </section>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script type="module" src="src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `styles/main.css`**

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #10141a;
  color: #f4f4f4;
}

#club-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #1b212b;
}

#club-crest {
  height: 48px;
  width: 48px;
  object-fit: contain;
}

#club-crest-fallback {
  height: 48px;
  min-width: 48px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.85rem;
  text-align: center;
}

#club-name {
  font-size: 1.1rem;
  margin: 0;
}

#map {
  height: 60vh;
  width: 100%;
}

#round-result,
#game-summary {
  padding: 16px;
}

button {
  font-size: 1rem;
  padding: 8px 16px;
  cursor: pointer;
}
```

- [ ] **Step 3: Create `src/mapView.js`**

```javascript
const ARGENTINA_CENTER = [-38.4161, -63.6167];
const ARGENTINA_ZOOM = 4;

export function createMapView(containerId) {
  const map = L.map(containerId).setView(ARGENTINA_CENTER, ARGENTINA_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  let clickHandler = null;
  let guessMarker = null;
  let actualMarker = null;
  let resultLine = null;

  map.on('click', (event) => {
    if (clickHandler) {
      clickHandler({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });

  return {
    onGuess(handler) {
      clickHandler = handler;
    },
    showGuess(latlng) {
      if (guessMarker) map.removeLayer(guessMarker);
      guessMarker = L.marker([latlng.lat, latlng.lng]).addTo(map);
    },
    showResult(guessLatLng, actualLatLng) {
      if (actualMarker) map.removeLayer(actualMarker);
      if (resultLine) map.removeLayer(resultLine);
      actualMarker = L.marker([actualLatLng.lat, actualLatLng.lng]).addTo(map);
      resultLine = L.polyline(
        [
          [guessLatLng.lat, guessLatLng.lng],
          [actualLatLng.lat, actualLatLng.lng],
        ],
        { color: 'red' }
      ).addTo(map);
      map.fitBounds(resultLine.getBounds(), { padding: [40, 40] });
    },
    reset() {
      if (guessMarker) {
        map.removeLayer(guessMarker);
        guessMarker = null;
      }
      if (actualMarker) {
        map.removeLayer(actualMarker);
        actualMarker = null;
      }
      if (resultLine) {
        map.removeLayer(resultLine);
        resultLine = null;
      }
      map.setView(ARGENTINA_CENTER, ARGENTINA_ZOOM);
    },
  };
}
```

- [ ] **Step 4: Create a temporary `src/main.js` to exercise the map view**

```javascript
import { createMapView } from './mapView.js';

const mapView = createMapView('map');
mapView.onGuess((latlng) => {
  console.log('Guess at', latlng);
  mapView.showGuess(latlng);
});
```

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`
Open the printed URL (e.g. `http://localhost:8080`).
Expected: a map of Argentina renders. Clicking anywhere on it drops a marker at the clicked point, and the browser console logs `Guess at { lat: ..., lng: ... }`.

- [ ] **Step 6: Commit**

```bash
git add index.html styles/main.css src/mapView.js src/main.js
git commit -m "feat: add page skeleton and Leaflet map view"
```

---

### Task 8: Game orchestration (`game.js`)

**Files:**
- Create: `src/game.js`
- Test: `tests/game.test.js`

**Interfaces:**
- Consumes: `haversineDistanceKm` from `./geo.js` (Task 2), `scoreForDistance` from `./scoring.js` (Task 3), `pickRounds` from `./roundPicker.js` (Task 4).
- Produces: `createGame(clubs: Array<Club>, options?: { roundCount?: number, rng?: () => number }): Game` where `Game = { currentClub(): Club | null, submitGuess(guessLatLng: {lat, lng}): { club: Club, guessLatLng: {lat, lng}, distanceKm: number, score: number }, isOver(): boolean, getResults(): Array<RoundResult>, getTotalScore(): number, roundCount: number }`. `submitGuess` throws if called after the game is over.

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/game.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game.js';

const clubs = [
  { id: 'a', lat: -34.6, lng: -58.4 },
  { id: 'b', lat: -31.4, lng: -64.2 },
  { id: 'c', lat: -32.9, lng: -60.6 },
];

test('createGame picks the requested number of rounds', () => {
  const game = createGame(clubs, { roundCount: 2, rng: () => 0 });
  assert.equal(game.roundCount, 2);
  assert.ok(game.currentClub());
});

test('submitGuess scores an exact guess at maximum and advances the round', () => {
  const game = createGame(clubs, { roundCount: 1, rng: () => 0 });
  const club = game.currentClub();
  const result = game.submitGuess({ lat: club.lat, lng: club.lng });
  assert.equal(result.score, 5000);
  assert.equal(result.distanceKm, 0);
  assert.ok(game.isOver());
});

test('getTotalScore sums all round scores and getResults returns them in order', () => {
  const game = createGame(clubs, { roundCount: 2, rng: () => 0 });
  const firstClub = game.currentClub();
  game.submitGuess({ lat: firstClub.lat, lng: firstClub.lng });
  const secondClub = game.currentClub();
  game.submitGuess({ lat: secondClub.lat, lng: secondClub.lng });
  assert.ok(game.isOver());
  assert.equal(game.getTotalScore(), 10000);
  assert.equal(game.getResults().length, 2);
});

test('submitGuess after the game is over throws', () => {
  const game = createGame(clubs, { roundCount: 1, rng: () => 0 });
  game.submitGuess({ lat: clubs[0].lat, lng: clubs[0].lng });
  assert.throws(() => game.submitGuess({ lat: 0, lng: 0 }), /No active round/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/game.test.js`
Expected: FAIL with "Cannot find module '../src/game.js'".

- [ ] **Step 3: Implement `src/game.js`**

```javascript
import { haversineDistanceKm } from './geo.js';
import { scoreForDistance } from './scoring.js';
import { pickRounds } from './roundPicker.js';

export function createGame(clubs, { roundCount = 5, rng = Math.random } = {}) {
  const rounds = pickRounds(clubs, roundCount, rng);
  const results = [];
  let currentIndex = 0;

  function currentClub() {
    if (currentIndex >= rounds.length) return null;
    return rounds[currentIndex];
  }

  function submitGuess(guessLatLng) {
    const club = currentClub();
    if (!club) {
      throw new Error('No active round to submit a guess for');
    }
    const distanceKm = haversineDistanceKm(guessLatLng, {
      lat: club.lat,
      lng: club.lng,
    });
    const score = scoreForDistance(distanceKm);
    const result = { club, guessLatLng, distanceKm, score };
    results.push(result);
    currentIndex += 1;
    return result;
  }

  function isOver() {
    return currentIndex >= rounds.length;
  }

  function getResults() {
    return results.slice();
  }

  function getTotalScore() {
    return results.reduce((sum, r) => sum + r.score, 0);
  }

  return {
    currentClub,
    submitGuess,
    isOver,
    getResults,
    getTotalScore,
    roundCount: rounds.length,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/game.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game.js tests/game.test.js
git commit -m "feat: add game orchestration combining distance, scoring, and round selection"
```

---

### Task 9: UI rendering and full wiring

**Files:**
- Create: `src/ui.js`
- Modify: `src/main.js` (replace the Task 7 harness entirely)

**Interfaces:**
- Consumes: `createGame` from `./game.js` (Task 8); `createMapView` from `./mapView.js` (Task 7); `saveBestScoreIfHigher` from `./bestScore.js` (Task 5); the DOM containers listed in Task 7's Interfaces.
- Produces (from `ui.js`, used by `main.js`): `showClubPrompt(club: Club): void`, `showRoundResult({distanceKm, score}): void`, `hideRoundResult(): void`, `showGameSummary({totalScore: number, bestScore: number, results: Array<RoundResult>}): void`, `hideGameSummary(): void`, `onNextRound(handler: () => void): void`, `onPlayAgain(handler: () => void): void`.

No automated test for this task — it is pure DOM wiring on top of already-tested logic (`game.js`, `bestScore.js`) and an already-tested map view. Verification is manual, in the browser.

- [ ] **Step 1: Create `src/ui.js`**

```javascript
const els = {
  crestImg: document.getElementById('club-crest'),
  crestFallback: document.getElementById('club-crest-fallback'),
  clubName: document.getElementById('club-name'),
  roundResult: document.getElementById('round-result'),
  resultDistance: document.getElementById('result-distance'),
  resultScore: document.getElementById('result-score'),
  nextRoundButton: document.getElementById('next-round-button'),
  gameSummary: document.getElementById('game-summary'),
  summaryTotal: document.getElementById('summary-total'),
  summaryBest: document.getElementById('summary-best'),
  summaryBreakdown: document.getElementById('summary-breakdown'),
  playAgainButton: document.getElementById('play-again-button'),
};

export function showClubPrompt(club) {
  els.clubName.textContent = club.name;
  if (club.crestUrl) {
    els.crestImg.src = club.crestUrl;
    els.crestImg.hidden = false;
    els.crestFallback.hidden = true;
  } else {
    els.crestImg.hidden = true;
    els.crestFallback.hidden = false;
    els.crestFallback.textContent = club.name;
    const colors = club.colors && club.colors.length ? club.colors : ['#333333'];
    els.crestFallback.style.background = colors[0];
    els.crestFallback.style.color = colors[1] || '#ffffff';
  }
}

export function showRoundResult({ distanceKm, score }) {
  els.resultDistance.textContent = `Distancia: ${distanceKm.toFixed(1)} km`;
  els.resultScore.textContent = `Puntos: ${score}`;
  els.roundResult.hidden = false;
}

export function hideRoundResult() {
  els.roundResult.hidden = true;
}

export function showGameSummary({ totalScore, bestScore, results }) {
  els.summaryTotal.textContent = `Puntaje total: ${totalScore}`;
  els.summaryBest.textContent = `Mejor puntaje: ${bestScore}`;
  els.summaryBreakdown.innerHTML = '';
  for (const result of results) {
    const li = document.createElement('li');
    li.textContent = `${result.club.name}: ${result.score} pts (${result.distanceKm.toFixed(1)} km)`;
    els.summaryBreakdown.appendChild(li);
  }
  els.gameSummary.hidden = false;
}

export function hideGameSummary() {
  els.gameSummary.hidden = true;
}

export function onNextRound(handler) {
  els.nextRoundButton.onclick = handler;
}

export function onPlayAgain(handler) {
  els.playAgainButton.onclick = handler;
}
```

- [ ] **Step 2: Replace `src/main.js` with the full game wiring**

```javascript
import { createGame } from './game.js';
import { createMapView } from './mapView.js';
import { saveBestScoreIfHigher } from './bestScore.js';
import {
  showClubPrompt,
  showRoundResult,
  hideRoundResult,
  showGameSummary,
  hideGameSummary,
  onNextRound,
  onPlayAgain,
} from './ui.js';

const ROUND_COUNT = 5;

async function loadClubs() {
  const response = await fetch('data/clubs.json');
  return response.json();
}

function presentRound(game, mapView) {
  hideRoundResult();
  mapView.reset();
  const club = game.currentClub();
  showClubPrompt(club);

  mapView.onGuess((latlng) => {
    mapView.onGuess(() => {}); // ignore further clicks until the next round (or forever, once the game is over)
    const result = game.submitGuess(latlng);
    mapView.showGuess(latlng);
    mapView.showResult(latlng, { lat: club.lat, lng: club.lng });

    if (game.isOver()) {
      const bestScore = saveBestScoreIfHigher(localStorage, game.getTotalScore());
      showGameSummary({
        totalScore: game.getTotalScore(),
        bestScore,
        results: game.getResults(),
      });
    } else {
      showRoundResult(result);
      onNextRound(() => presentRound(game, mapView));
    }
  });
}

function startNewGame(clubs, mapView) {
  hideGameSummary();
  const game = createGame(clubs, { roundCount: ROUND_COUNT });
  presentRound(game, mapView);
}

async function main() {
  const clubs = await loadClubs();
  const mapView = createMapView('map');
  onPlayAgain(() => startNewGame(clubs, mapView));
  startNewGame(clubs, mapView);
}

main();
```

- [ ] **Step 3: Manually verify a full round in the browser**

Run: `npm run dev` (if not already running)
Open the printed URL.
Expected:
- A club name and a colored fallback box (our seed dataset has no `crestUrl` yet) appear at the top.
- Clicking the map drops a guess marker, then immediately shows a red line to the real location, the distance, and the score, plus a "Siguiente ronda" button.
- Clicking "Siguiente ronda" clears the map and shows a new club.

- [ ] **Step 4: Manually verify the end of a game**

Play through all 5 rounds.
Expected: after the 5th guess, the round-result panel is skipped and the summary panel appears directly, showing the total score, the best score, and a 5-item breakdown list. Clicking "Jugar de nuevo" hides the summary and starts a fresh 5-round game.

- [ ] **Step 5: Commit**

```bash
git add src/ui.js src/main.js
git commit -m "feat: wire up UI rendering for rounds and game summary"
```

---

### Task 10: End-to-end verification and README wrap-up

**Files:**
- Modify: `README.md`

No new source files — this task validates the finished game against the spec's "Testing / validación" section and documents it.

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: all tests pass (smoke, geo, scoring, roundPicker, bestScore, clubsData, game — 20 tests total across the suite).

- [ ] **Step 2: Manually verify the near-exact-guess control case**

Run: `npm run dev` (if not already running), open the printed URL.
Zoom in on the map (scroll wheel) before clicking, and click as close as possible to a club you recognize (e.g. Boca Juniors, in La Boca, Buenos Aires).
Expected: the resulting score is high (above 4000), confirming the scoring curve rewards precise guesses. (The exact-guess case — a click at the precise coordinate scoring exactly 5000 — is already covered by the automated test in `tests/game.test.js`.)

- [ ] **Step 3: Manually verify the far-guess control case**

Start a new round. Click on the opposite end of the country from the shown club (e.g. click in the far north if the club is in Buenos Aires, or vice versa).
Expected: the resulting score is at or near 0.

- [ ] **Step 4: Manually verify the crest fallback**

Observe the club prompt across several rounds.
Expected: since every seed club in `data/clubs.json` has `crestUrl: null`, every round shows the text/color fallback box (from `showClubPrompt` in `src/ui.js`), never a broken image icon.

- [ ] **Step 5: Manually verify best-score persistence**

Finish a full 5-round game and note the total score shown in the summary.
Reload the page (full browser refresh) and open the browser console.
Run: `localStorage.getItem('maptap-argentina-best-score')`
Expected: the value matches the total score from the finished game (or a higher score, if a previous run scored higher).

- [ ] **Step 6: Update `README.md` with a dataset note**

Add this section to `README.md`, after the existing "Desarrollo" section:

```markdown
## Dataset

`data/clubs.json` arranca con un set chico de clubes de ejemplo (ver
`docs/superpowers/specs/2026-09-04-maptap-argentina-design.md`). Las
coordenadas son un punto de partida a verificar, no datos GPS confirmados,
y ningún club trae `crestUrl` todavía — todos usan el fallback de texto y
colores. Sumar clubes y escudos reales (Wikimedia Commons) es trabajo manual
y continuo, club por club.
```

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: document dataset status and finish end-to-end verification"
```
