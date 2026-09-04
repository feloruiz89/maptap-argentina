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

const mixedClubs = [
  { id: 'f1', discipline: 'futbol', lat: -34.6, lng: -58.4 },
  { id: 'f2', discipline: 'futbol', lat: -34.5, lng: -58.5 },
  { id: 'f3', discipline: 'futbol', lat: -31.4, lng: -64.2 },
  { id: 'f4', discipline: 'futbol', lat: -32.9, lng: -60.6 },
  { id: 'f5', discipline: 'futbol', lat: -31.3, lng: -64.3 },
  { id: 'r1', discipline: 'rugby', lat: -34.4, lng: -58.6 },
  { id: 'r2', discipline: 'rugby', lat: -34.45, lng: -58.55 },
  { id: 'r3', discipline: 'rugby', lat: -34.42, lng: -58.65 },
];

function disciplineCounts(rounds) {
  const counts = {};
  for (const club of rounds) {
    counts[club.discipline] = (counts[club.discipline] ?? 0) + 1;
  }
  return counts;
}

test('a 5-round game always includes at least 2 clubs of each discipline present', () => {
  for (let trial = 0; trial < 20; trial++) {
    const game = createGame(mixedClubs, { roundCount: 5, rng: Math.random });
    const rounds = [];
    while (!game.isOver()) {
      const club = game.currentClub();
      rounds.push(club);
      game.submitGuess({ lat: club.lat, lng: club.lng });
    }
    assert.equal(rounds.length, 5);
    assert.equal(new Set(rounds.map((c) => c.id)).size, 5, 'rounds must be unique');

    const counts = disciplineCounts(rounds);
    assert.ok(counts.futbol >= 2, `expected >=2 futbol, got ${counts.futbol ?? 0}`);
    assert.ok(counts.rugby >= 2, `expected >=2 rugby, got ${counts.rugby ?? 0}`);
  }
});
