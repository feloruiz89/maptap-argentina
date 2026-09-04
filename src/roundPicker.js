export function pickRounds(clubs, count, rng = Math.random) {
  if (count > clubs.length) {
    throw new RangeError(
      `Cannot pick ${count} rounds from ${clubs.length} clubs`
    );
  }

  const shuffled = clubs.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
