# El Gramur

Sitio web de **El Gramur**, un restaurante de cocina de brasa en Buenos Aires.
Es una **demo**: el restaurante, los nombres, los precios, los horarios y la dirección son ficticios.

## Qué incluye

- **Hero con fuego en vivo**: llamas y chispas dibujadas en WebGL (sin imágenes), que reaccionan al mouse, se pausan fuera de pantalla y bajan la calidad solo si el equipo no sostiene el ritmo.
- **Estado real del local**: "Abierto ahora / Cerrado ahora" calculado con la hora de Buenos Aires y la tabla de horarios (incluye el servicio que pasa de medianoche).
- **Carta interactiva**: cinco secciones con pestañas accesibles (teclado: flechas, Inicio y Fin) y filtros de vegetariano y sin gluten.
- **Reservas funcionales** (solo en el navegador): validación, turnos según el día, turnos pasados o completos deshabilitados, lunes cerrado y confirmación. No envía nada a ningún servidor.
- **Experiencias** que preseleccionan la reserva, mapa esquemático en SVG, datos estructurados `Restaurant` y metadatos para compartir.
- Responsive, navegable por teclado, respeta `prefers-reduced-motion` y funciona sin JavaScript (el contenido nunca queda oculto).

## Diseño

- **Paleta**: tizón `#150e0a`, bordó `#2a0f14`, hueso `#f3e9d6`, miel `#e0a84a` y ascua `#d9622b`.
- **Tipografía**: Bodoni Moda (títulos) y Hanken Grotesk (texto), alojadas en `assets/fonts`.
- **Movimiento**: una sola escena protagonista (el fuego); el resto es discreto: texto del manifiesto que se enciende con el scroll, apariciones suaves y la carta que se reordena al cambiar de sección.

## Desarrollo

```bash
npm install
npm run build   # empaqueta src/ en assets/app.js (GSAP + fuego WebGL)
npm run dev     # servidor local en http://localhost:8780
```

`assets/app.js` está versionado, así que el sitio se puede publicar tal cual (GitHub Pages, Cloudflare Pages, Netlify) sin paso de compilación.

## Estructura

```
index.html      contenido y metadatos
styles.css      estilos
src/app.js      carta, reservas, horarios y animaciones
src/fire.js     el fuego del hero (WebGL)
assets/         app.js compilado, fuentes y favicon
scripts/        servidor local
```

## Para llevarlo a un restaurante real

Reemplazar el contenido ficticio de `index.html` y `src/app.js` (carta, horarios, dirección, contacto), conectar el formulario a un servicio de reservas y cambiar la URL canónica por el dominio real.
