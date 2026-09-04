# Maptap Argentina

Juego de geolocalización de clubes de fútbol y rugby argentinos, estilo
GeoGuessr/maptap.gg. Diseño completo en
`docs/superpowers/specs/2026-09-04-maptap-argentina-design.md`.

## Desarrollo

Correr los tests unitarios:

    npm test

Levantar el juego en el navegador:

    npm run dev

Abrir la URL que imprime el comando (por defecto `http://localhost:8080`).

El mapa usa tiles satelitales de Esri World Imagery (gratis, sin API key),
no tiles de calles de OpenStreetMap — ver `src/mapView.js`.

## Dataset

`data/clubs.json` arranca con un set chico de clubes de ejemplo (ver
`docs/superpowers/specs/2026-09-04-maptap-argentina-design.md`). Las
coordenadas son un punto de partida a verificar, no datos GPS confirmados,
y ningún club trae `crestUrl` todavía — todos usan el fallback de texto y
colores. Sumar clubes y escudos reales (Wikimedia Commons) es trabajo manual
y continuo, club por club.
