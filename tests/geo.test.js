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
