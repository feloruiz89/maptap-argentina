import { createGame } from './game.js';
import { createMapView } from './mapView.js';
import { saveBestScoreIfHigher } from './bestScore.js';
import {
  showClubPrompt,
  showRoundResult,
  hideRoundResult,
  showGameSummary,
  hideGameSummary,
  onNextRound,
  onPlayAgain,
} from './ui.js';

const ROUND_COUNT = 5;

async function loadClubs() {
  const response = await fetch('data/clubs.json');
  return response.json();
}

function presentRound(game, mapView) {
  hideRoundResult();
  mapView.reset();
  const club = game.currentClub();
  showClubPrompt(club);

  mapView.onGuess((latlng) => {
    mapView.onGuess(() => {}); // ignore further clicks until the next round (or forever, once the game is over)
    const result = game.submitGuess(latlng);
    mapView.showGuess(latlng);
    mapView.showResult(latlng, { lat: club.lat, lng: club.lng });

    if (game.isOver()) {
      const bestScore = saveBestScoreIfHigher(localStorage, game.getTotalScore());
      showGameSummary({
        totalScore: game.getTotalScore(),
        bestScore,
        results: game.getResults(),
      });
    } else {
      showRoundResult(result);
      onNextRound(() => presentRound(game, mapView));
    }
  });
}

function startNewGame(clubs, mapView) {
  hideGameSummary();
  const game = createGame(clubs, { roundCount: ROUND_COUNT });
  presentRound(game, mapView);
}

async function main() {
  const clubs = await loadClubs();
  const mapView = createMapView('map');
  onPlayAgain(() => startNewGame(clubs, mapView));
  startNewGame(clubs, mapView);
}

main();
