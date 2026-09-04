const MAX_SCORE = 100;
const DECAY_KM = 30;

export function scoreForDistance(distanceKm) {
  const raw = MAX_SCORE * Math.exp(-distanceKm / DECAY_KM);
  return Math.max(0, Math.round(raw));
}
