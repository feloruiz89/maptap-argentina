const ARGENTINA_CENTER = [-38.4161, -63.6167];
const ARGENTINA_ZOOM = 4;
const COUNTRY_BORDERS_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

export function createMapView(containerId) {
  const map = L.map(containerId).setView(ARGENTINA_CENTER, ARGENTINA_ZOOM);
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 18,
    }
  ).addTo(map);

  // Country borders only, no place-name labels (labels would give away the
  // guess). Drawn as plain vector lines instead of a labelled reference
  // tile layer, so there is no text to accidentally show.
  fetch(COUNTRY_BORDERS_URL)
    .then((response) => response.json())
    .then((geojson) => {
      L.geoJSON(geojson, {
        interactive: false,
        style: { color: '#e8e8e8', weight: 1, opacity: 0.6, fill: false },
      }).addTo(map);
    })
    .catch((error) => {
      console.warn('No se pudieron cargar los límites de países:', error);
    });

  let clickHandler = null;
  let guessMarker = null;
  let actualMarker = null;
  let resultLine = null;

  map.on('click', (event) => {
    if (clickHandler) {
      clickHandler({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });

  return {
    onGuess(handler) {
      clickHandler = handler;
    },
    showGuess(latlng) {
      if (guessMarker) map.removeLayer(guessMarker);
      guessMarker = L.marker([latlng.lat, latlng.lng]).addTo(map);
    },
    showResult(guessLatLng, actualLatLng) {
      if (actualMarker) map.removeLayer(actualMarker);
      if (resultLine) map.removeLayer(resultLine);
      actualMarker = L.marker([actualLatLng.lat, actualLatLng.lng]).addTo(map);
      resultLine = L.polyline(
        [
          [guessLatLng.lat, guessLatLng.lng],
          [actualLatLng.lat, actualLatLng.lng],
        ],
        { color: 'red' }
      ).addTo(map);
      map.fitBounds(resultLine.getBounds(), { padding: [40, 40] });
    },
    reset() {
      if (guessMarker) {
        map.removeLayer(guessMarker);
        guessMarker = null;
      }
      if (actualMarker) {
        map.removeLayer(actualMarker);
        actualMarker = null;
      }
      if (resultLine) {
        map.removeLayer(resultLine);
        resultLine = null;
      }
      map.setView(ARGENTINA_CENTER, ARGENTINA_ZOOM);
    },
  };
}
