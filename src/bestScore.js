// v2: bumped when the scoring scale changed from a 5000-max to a 100-max
// per round, so old best scores from the previous scale don't leak in as
// an impossible-to-beat number.
const STORAGE_KEY = 'maptap-argentina-best-score-v2';

export function getBestScore(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  const parsed = raw === null ? 0 : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveBestScoreIfHigher(storage, score) {
  const current = getBestScore(storage);
  if (score > current) {
    storage.setItem(STORAGE_KEY, String(score));
    return score;
  }
  return current;
}
