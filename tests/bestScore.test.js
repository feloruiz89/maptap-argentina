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
