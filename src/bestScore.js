const STORAGE_KEY = 'maptap-argentina-best-score';

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
