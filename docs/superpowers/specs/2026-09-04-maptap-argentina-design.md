# Maptap Argentina — Design Spec

Fecha: 2026-09-04
Estado: Aprobado por el usuario, pendiente de plan de implementación

## Propósito

Juego web tipo GeoGuessr/maptap.gg, pero acotado a clubes de fútbol y rugby de
Argentina. Proyecto personal/hobby, sin fines comerciales. El jugador ve el
escudo y nombre de un club y debe clickear en un mapa dónde cree que está
ubicado; el puntaje depende de qué tan cerca cayó el clic.

## Alcance v1

- Fútbol: clubes de Primera División y Primera Nacional (AFA).
- Rugby: clubes de URBA Top 12 + algunos clásicos históricos adicionales.
- Total estimado: 40-60 clubes.
- Explícitamente fuera de alcance: cuentas de usuario, leaderboard global,
  modo multijugador, fotos de estadio como pista, ligas regionales de fútbol
  (Federal A/B), uniones de rugby del interior.

## Mecánica de juego

1. Partida = 5 rondas.
2. Cada ronda:
   - Se elige un club al azar del dataset (sin repetir dentro de la misma
     partida).
   - Se muestra su escudo y nombre. No se revela la disciplina (fútbol/rugby)
     como pista adicional.
   - El jugador clickea un punto en el mapa de Argentina.
   - Al confirmar el clic:
     - Se traza una línea entre el punto clickeado y la ubicación real del
       club.
     - Se muestra la distancia en km.
     - Se calcula el puntaje de la ronda con una curva de decaimiento
       exponencial: puntaje máximo (5000) para distancia ~0, cae rápido en
       los primeros 15-20 km, tiende a 0 a partir de ~300-400 km. La curva
       está calibrada a la escala de Argentina (más generosa que un
       GeoGuessr mundial, donde esas distancias serían triviales).
3. Al finalizar las 5 rondas:
   - Resumen con puntaje total (suma de las 5 rondas) y breakdown por ronda
     (club, distancia, puntaje).
   - Se compara contra el mejor puntaje guardado en `localStorage` del
     navegador y se actualiza si corresponde. No hay backend ni cuentas: el
     "mejor puntaje" es local a cada navegador/dispositivo.

## Dataset

Un único archivo JSON versionado a mano (`data/clubs.json`), que se amplía
manualmente con el tiempo. Cada entrada:

```json
{
  "id": "boca-juniors",
  "name": "Club Atlético Boca Juniors",
  "discipline": "futbol",
  "lat": -34.6356,
  "lng": -58.3648,
  "crestUrl": "https://upload.wikimedia.org/.../boca.svg",
  "colors": ["#0b3b7a", "#f6c700"]
}
```

- `lat`/`lng` corresponden a la sede/estadio del club, no a la ciudad en
  general (necesario para diferenciar clubes de una misma ciudad, p. ej.
  Boca/River o los de zona norte en rugby).
- `crestUrl` apunta a una imagen de Wikimedia Commons (uso libre, curado a
  mano). Si un club no tiene escudo con licencia clara disponible, no lleva
  `crestUrl` y el frontend renderiza un fallback de texto usando `colors`
  (nombre del club sobre esos colores) en vez de forzar una imagen.
- La curación del dataset (buscar cada club, su coordenada real y su escudo)
  es trabajo manual fuera del código — el plan de implementación debe dejar
  el archivo con una estructura clara y unos pocos clubes de ejemplo, no
  pretender completar los 40-60 automáticamente.

## Arquitectura técnica

- Frontend estático: HTML/CSS/JS plano, sin framework (proyecto chico, no lo
  amerita).
- Mapa: Leaflet + tiles de OpenStreetMap (gratis, sin API key, buen detalle
  en Argentina).

> **Actualización post-implementación:** por pedido del usuario durante la
> implementación, el mapa usa tiles satelitales de Esri World Imagery en vez
> de tiles de calles de OpenStreetMap (mismo criterio: gratis, sin API key).
> Ver `src/mapView.js`.

- Sin backend. Todo el estado de la partida vive en memoria del navegador;
  el único dato persistente es el mejor puntaje en `localStorage`.
- Hosting: sitio estático desplegable en Vercel/Netlify/GitHub Pages con
  `git push`. Sin costo fijo.

## Estructura de proyecto (referencia para el plan de implementación)

- `index.html` — pantalla única de juego (inicio, rondas, resumen final como
  estados de una misma vista, o vistas separadas simples).
- `data/clubs.json` — dataset de clubes.
- `src/` — lógica de juego (selección de rondas, cálculo de distancia/
  puntaje, manejo de `localStorage`, integración con Leaflet).
- `styles/` — estilos.

## Testing / validación

- Verificación manual en navegador: jugar una partida completa de 5 rondas,
  confirmar que la distancia y el puntaje calculados son consistentes con la
  posición real del club (casos de control: clic exacto → puntaje máximo;
  clic en el extremo opuesto del país → puntaje ~0).
- Validar el fallback de escudo (club sin `crestUrl` debe mostrar el
  fallback de texto, no un ícono roto).
- Validar persistencia de mejor puntaje en `localStorage` entre partidas.
- No se requiere suite de tests automatizados dado el alcance del proyecto;
  si el proyecto crece (backend, leaderboard), se reevalúa.
