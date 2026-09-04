import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreForDistance } from '../src/scoring.js';

test('exact guess scores the maximum', () => {
  assert.equal(scoreForDistance(0), 100);
});

test('a guess ~20km away loses about half the points', () => {
  const score = scoreForDistance(20);
  assert.ok(score > 46 && score < 54, `expected ~50, got ${score}`);
});

test('a guess far away scores 0, never negative', () => {
  assert.equal(scoreForDistance(1000), 0);
  assert.equal(scoreForDistance(1_000_000), 0);
});
