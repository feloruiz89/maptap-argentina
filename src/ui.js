const els = {
  crestImg: document.getElementById('club-crest'),
  crestFallback: document.getElementById('club-crest-fallback'),
  clubName: document.getElementById('club-name'),
  runningScoreValue: document.getElementById('running-score-value'),
  roundResult: document.getElementById('round-result'),
  resultDistance: document.getElementById('result-distance'),
  resultScore: document.getElementById('result-score'),
  nextRoundButton: document.getElementById('next-round-button'),
  gameSummary: document.getElementById('game-summary'),
  summaryTotal: document.getElementById('summary-total'),
  summaryBest: document.getElementById('summary-best'),
  summaryBreakdown: document.getElementById('summary-breakdown'),
  whatsappShare: document.getElementById('whatsapp-share'),
  playAgainButton: document.getElementById('play-again-button'),
};

function emojiForScore(score) {
  if (score >= 85) return '🎯';
  if (score >= 60) return '🔥';
  if (score >= 30) return '👍';
  if (score >= 5) return '😅';
  return '💀';
}

export function showClubPrompt(club) {
  els.clubName.textContent = club.name;
  if (club.crestUrl) {
    els.crestImg.src = club.crestUrl;
    els.crestImg.hidden = false;
    els.crestFallback.hidden = true;
    els.crestFallback.textContent = '';
    els.crestFallback.style.background = '';
    els.crestFallback.style.color = '';
  } else {
    els.crestImg.hidden = true;
    els.crestFallback.hidden = false;
    els.crestFallback.textContent = club.name;
    const colors = club.colors && club.colors.length ? club.colors : ['#333333'];
    els.crestFallback.style.background = colors[0];
    els.crestFallback.style.color = colors[1] || '#ffffff';
  }
}

export function updateRunningScore(totalScore) {
  els.runningScoreValue.textContent = totalScore;
}

export function showRoundResult({ distanceKm, score }) {
  els.resultDistance.textContent = `📍 Distancia: ${distanceKm.toFixed(1)} km`;
  els.resultScore.textContent = `${emojiForScore(score)} Puntos: ${score}`;
  els.roundResult.hidden = false;
}

export function hideRoundResult() {
  els.roundResult.hidden = true;
}

export function showGameSummary({ totalScore, bestScore, results }) {
  els.summaryTotal.textContent = `🏆 Puntaje total: ${totalScore}`;
  els.summaryBest.textContent = `⭐ Mejor puntaje: ${bestScore}`;
  els.summaryBreakdown.innerHTML = '';
  for (const result of results) {
    const li = document.createElement('li');
    li.textContent = `${emojiForScore(result.score)} ${result.club.name}: ${result.score} pts (${result.distanceKm.toFixed(1)} km)`;
    els.summaryBreakdown.appendChild(li);
  }

  const shareText = `🗺️⚽🏉 Saqué ${totalScore} puntos en Maptap Argentina, ¿me superás? ${window.location.href}`;
  els.whatsappShare.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  els.gameSummary.hidden = false;
}

export function hideGameSummary() {
  els.gameSummary.hidden = true;
}

export function onNextRound(handler) {
  els.nextRoundButton.onclick = handler;
}

export function onPlayAgain(handler) {
  els.playAgainButton.onclick = handler;
}
