import { haversineDistanceKm } from './geo.js';
import { scoreForDistance } from './scoring.js';
import { pickRounds } from './roundPicker.js';

function pickBalancedRounds(clubs, count, rng) {
  const byDiscipline = new Map();
  for (const club of clubs) {
    const group = byDiscipline.get(club.discipline) ?? [];
    group.push(club);
    byDiscipline.set(club.discipline, group);
  }

  const disciplines = [...byDiscipline.keys()];
  const minPerDiscipline = Math.floor(count / disciplines.length);

  const guaranteed = [];
  for (const discipline of disciplines) {
    const group = byDiscipline.get(discipline);
    const take = Math.min(minPerDiscipline, group.length);
    guaranteed.push(...pickRounds(group, take, rng));
  }

  const guaranteedIds = new Set(guaranteed.map((c) => c.id));
  const remainingPool = clubs.filter((c) => !guaranteedIds.has(c.id));
  const remainingCount = count - guaranteed.length;
  const rest =
    remainingCount > 0 ? pickRounds(remainingPool, remainingCount, rng) : [];

  const combined = [...guaranteed, ...rest];
  return pickRounds(combined, combined.length, rng);
}

export function createGame(clubs, { roundCount = 5, rng = Math.random } = {}) {
  const rounds = pickBalancedRounds(clubs, roundCount, rng);
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
