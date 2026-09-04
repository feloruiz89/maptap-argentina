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
