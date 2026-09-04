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
`docs/superpowers/specs/2026-09-04-maptap-argentina-design.md`). 11 de los
12 clubes tienen `crestUrl` real (Wikimedia Commons, verificado que cada
imagen carga) y coordenadas cruzadas contra Wikipedia/Nominatim; Club
Newman no tiene un escudo con licencia clara en Commons, así que se queda
con el fallback de texto y colores a propósito. Ampliar el dataset hacia
los 40-60 clubes del spec sigue siendo trabajo manual y continuo, club por
club.
