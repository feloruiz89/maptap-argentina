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
