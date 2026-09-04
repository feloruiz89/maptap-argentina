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
