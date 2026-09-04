import { createMapView } from './mapView.js';

const mapView = createMapView('map');
mapView.onGuess((latlng) => {
  console.log('Guess at', latlng);
  mapView.showGuess(latlng);
});
