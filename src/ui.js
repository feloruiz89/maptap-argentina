const els = {
  crestImg: document.getElementById('club-crest'),
  crestFallback: document.getElementById('club-crest-fallback'),
  clubName: document.getElementById('club-name'),
  roundResult: document.getElementById('round-result'),
  resultDistance: document.getElementById('result-distance'),
  resultScore: document.getElementById('result-score'),
  nextRoundButton: document.getElementById('next-round-button'),
  gameSummary: document.getElementById('game-summary'),
  summaryTotal: document.getElementById('summary-total'),
  summaryBest: document.getElementById('summary-best'),
  summaryBreakdown: document.getElementById('summary-breakdown'),
  playAgainButton: document.getElementById('play-again-button'),
};

export function showClubPrompt(club) {
  els.clubName.textContent = club.name;
  if (club.crestUrl) {
    els.crestImg.src = club.crestUrl;
    els.crestImg.hidden = false;
    els.crestFallback.hidden = true;
  } else {
    els.crestImg.hidden = true;
    els.crestFallback.hidden = false;
    els.crestFallback.textContent = club.name;
    const colors = club.colors && club.colors.length ? club.colors : ['#333333'];
    els.crestFallback.style.background = colors[0];
    els.crestFallback.style.color = colors[1] || '#ffffff';
  }
}

export function showRoundResult({ distanceKm, score }) {
  els.resultDistance.textContent = `Distancia: ${distanceKm.toFixed(1)} km`;
  els.resultScore.textContent = `Puntos: ${score}`;
  els.roundResult.hidden = false;
}

export function hideRoundResult() {
  els.roundResult.hidden = true;
}

export function showGameSummary({ totalScore, bestScore, results }) {
  els.summaryTotal.textContent = `Puntaje total: ${totalScore}`;
  els.summaryBest.textContent = `Mejor puntaje: ${bestScore}`;
  els.summaryBreakdown.innerHTML = '';
  for (const result of results) {
    const li = document.createElement('li');
    li.textContent = `${result.club.name}: ${result.score} pts (${result.distanceKm.toFixed(1)} km)`;
    els.summaryBreakdown.appendChild(li);
  }
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
