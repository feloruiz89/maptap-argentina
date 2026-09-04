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
