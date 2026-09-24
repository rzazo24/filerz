# Changelog

_This changelog is only kept in Spanish. See [README.en.md](README.en.md) for the project in English._

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.12.0] - 2026-09-24

### Added
- Suite de tests, separada de la app (no afecta el despliegue): unitarios con `node --test` para lógica pura (ID corto, parseo de código/URL pegada, paridad de claves del i18n ES/EN) extraída directamente de `index.html`, y end-to-end con Playwright que arman el flujo completo emisor→receptor contra el broker real de PeerJS Cloud, decodifican el QR generado, revisan el layout en móvil y validan que un enlace ya usado rechace una segunda conexión.
- `vercel.json` ahora fuerza `installCommand`/`buildCommand` a no-ops, para que Vercel no intente correr `npm install` (y el postinstall de Playwright) en cada deploy solo porque existe un `package.json` de testing.

## [0.11.2] - 2026-09-24

### Fixed
- Ajuste de márgenes en los botones "Copiar" apilados en móvil: ahora dejan hueco a su propia sombra (el efecto pixel-art de la app) para que el borde visual quede alineado con el del campo de arriba, en vez de sobresalir por la derecha.

## [0.11.1] - 2026-09-24

### Fixed
- Los botones "Copiar" (del enlace y del código) desbordaban el borde de la tarjeta en algunos móviles en modo PWA, por diferencia de métricas entre la fuente pixel-art real del dispositivo y la de respaldo usada al probar. En pantallas estrechas, el campo y su botón ahora se apilan (input arriba, botón a ancho completo debajo), independientemente del ancho real de la fuente.

## [0.11.0] - 2026-09-24

### Added
- Campo adicional debajo del enlace, en la pantalla del emisor, con solo el código de la sesión (p. ej. `ABCD-1234`) y su propio botón de copiar. Pensado para cuando el enlace completo es incómodo de copiar o dictar, sobre todo en pantallas de móvil.

## [0.10.5] - 2026-09-24

### Documentation
- Captura de pantalla de la app (pantalla del emisor con el archivo elegido, enlace y QR) en README.md y README.en.md, una por idioma.

## [0.10.4] - 2026-09-24

### Documentation
- README (ES/EN) y ayuda de la app actualizados para mencionar el botón "Recargar" al completarse la transferencia.

## [0.10.3] - 2026-09-24

### Added
- Botón "Recargar" al completarse la transferencia, en ambos lados. En el emisor recarga la página (vuelve a la pantalla de elegir archivo); en el receptor limpia el enlace de la URL antes de recargar, para no reintentar conectarse a un enlace que ya se usó.

## [0.10.2] - 2026-09-24

### Fixed
- La fuente 'Pixelify Sans' renderizaba mal la ligadura "fi" en algunos dispositivos (ej. "file" se veía como "Ale", "first" como "Arst"). Se desactivan las ligaduras tipográficas en toda la app.
- El modal de ayuda y el cartel de actualización no respetaban el área segura del dispositivo (notch, barra de estado en PWA instalada): el modal podía quedar pegado contra la barra de estado. Ahora ambos usan el mismo padding con `env(safe-area-inset-*)` que ya usa el resto de la app, y el alto máximo del modal se recalcula para no desbordar en pantallas chicas.

## [0.10.1] - 2026-09-24

### Fixed
- El código del enlace era difícil de leer y tipear: la tipografía pixel-art del resto de la app confundía mayúsculas con minúsculas (y algunos números) en el campo de código y en el enlace. Ahora esos dos campos usan una fuente monoespaciada real, y el ID generado es solo en mayúsculas (antes mezclaba mayúsculas y minúsculas). El campo de código además normaliza a mayúsculas lo que se escriba, así que da igual el uso de mayúsculas/minúsculas al tipear.

## [0.10.0] - 2026-09-24

### Added
- Nueva forma de recibir sin depender del enlace: en la pantalla principal se puede escribir el código a mano (acepta el código solo o una URL completa pegada) o escanear el QR con la cámara del dispositivo directamente desde la página, sin salir a una app externa. Usa [jsQR](https://github.com/cozmo/jsQR) vía CDN para decodificar el video en vivo; si la cámara no está disponible o la librería no carga, se avisa con un mensaje claro y queda la opción de escribir el código a mano.

## [0.9.1] - 2026-09-24

### Changed
- El ID del enlace se separa en dos bloques de 4 caracteres con un guion (`abcd-1234`), para que sea más fácil de leer o tipear a mano, por ejemplo cuando no hay cámara para escanear el QR.

## [0.9.0] - 2026-09-24

### Changed
- El enlace generado es mucho más corto: en vez del UUID largo que asignaba por defecto el broker de PeerJS Cloud, ahora se genera un ID propio de 8 caracteres (sin `0/O/1/l/I` para evitar confusiones). Si por casualidad coincide con uno ya en uso, se reintenta automáticamente con uno nuevo hasta 4 veces antes de mostrar un error.

## [0.8.5] - 2026-09-24

### Added
- Se documenta en el README (ambos idiomas) y en el modal de ayuda que por ahora solo se envía un archivo por transferencia, con el workaround de comprimir varios en un `.zip`. No se implementa selección múltiple todavía.

## [0.8.4] - 2026-09-24

### Fixed
- Cuando el contenido de la tarjeta era más alto que la pantalla (por ejemplo, al elegir un archivo aparecen la tarjeta del archivo, el QR y el enlace, sumando más alto), el centrado vertical de la página empujaba la parte de arriba —título y botones del encabezado— por encima del borde superior, y esa parte quedaba inalcanzable con scroll (es una limitación general de centrar contenido que desborda en CSS). Se pasa a `align-items: safe center`, que centra igual cuando el contenido entra pero nunca lo empuja fuera del área con la que se puede hacer scroll cuando no entra.

## [0.8.3] - 2026-09-24

### Fixed
- El aviso de "hay una actualización disponible" nunca aparecía: el navegador solo detecta una versión nueva del service worker cuando el archivo `sw.js` cambia de bytes, y no se había vuelto a tocar desde que se implementó el aviso, pese a varios deploys posteriores que sí cambiaron `index.html`. Se sube el número de versión del caché (ahora `filerz-shell-v3`) y se deja un comentario en `sw.js` recordando subirlo en cada deploy que cambie el shell (`index.html`, `manifest.json` o los íconos), que es lo único que dispara la detección.
- Se agrega `vercel.json` forzando `Cache-Control: no-cache` en `/sw.js`, para que el navegador siempre revalide ese archivo contra el servidor en vez de servir una copia cacheada por HTTP, que también podría ocultar una actualización real.

## [0.8.2] - 2026-09-24

### Changed
- Los 4 botones del encabezado (ayuda, idioma, tema, estado) ahora tienen exactamente el mismo tamaño (cuadrados de 40×40px, 44×44px en móvil). El pill de estado dejó de mostrar el texto ("listo", "enviando", etc.) todo el tiempo: ahora se ve como los demás y ese texto queda disponible al pasar el mouse (`title`) o para lectores de pantalla (`role="status"` + texto oculto visualmente).

## [0.8.1] - 2026-09-24

### Fixed
- Los botones del encabezado (ayuda, idioma, tema, estado) se desbordaban del borde de la tarjeta en pantallas angostas, sobre todo instalado como PWA en el celular. Ahora el encabezado permite que "Filerz" y los botones pasen a una segunda línea alineada a la derecha cuando no entran en una sola, en vez de recortarse fuera de la tarjeta.

## [0.8.0] - 2026-09-24

### Added
- Interfaz bilingüe (español/inglés): detecta el idioma del navegador al cargar, con un botón ES/EN en el encabezado para cambiarlo manualmente; la preferencia se guarda en `localStorage`. Todos los textos de la interfaz (estáticos y de estado, incluido el modal de ayuda) pasan por un pequeño sistema de traducción (`I18N`/`t()`) en vez de estar escritos directo en el código.

### Changed
- Los mensajes de error que el emisor manda al receptor por el canal de datos (enlace ya usado, transferencia en curso) ahora viajan como códigos en vez de texto ya traducido, para que cada lado los muestre en su propio idioma sin depender del idioma del otro extremo.

## [0.7.0] - 2026-09-24

### Added
- Vercel Analytics (`/_vercel/insights/script.js`), sin necesidad de build ni paquetes npm. Requiere habilitar "Web Analytics" en el dashboard de Vercel para el proyecto; sin eso, el script no hace nada.
- Botón de ayuda (`?`) en el encabezado que abre un modal con instrucciones de uso (enviar, recibir, cosas a tener en cuenta) y un link a este repositorio de GitHub.

## [0.6.1] - 2026-09-24

### Added
- Aviso de actualización disponible: cuando se publica una nueva versión, aparece un cartel para recargar la página y activarla al instante, en vez de que el service worker la aplique en silencio.

### Fixed
- El service worker ya no llama `skipWaiting()` automáticamente al instalar, así que una actualización no reemplaza la versión en uso hasta que el usuario confirme. El listener de `controllerchange` que dispara el reload se agrega solo al confirmar, para no recargar la página de forma espontánea la primera vez que el service worker toma control (`clients.claim()` también dispara ese evento en la instalación inicial).

## [0.6.0] - 2026-09-24

### Added
- Filerz ahora es una PWA instalable: `manifest.json` con íconos (incluidas variantes maskable) generados a partir del glyph pixel-art existente, y un service worker (`sw.js`) que cachea el shell de la app (HTML, manifest e íconos) para que abra al instante y siga funcionando sin conexión. Las transferencias en sí siguen necesitando red.
- Meta tags para instalación en iOS/Android (`apple-touch-icon`, `apple-mobile-web-app-*`) y `theme-color` sincronizado con el toggle de tema claro/oscuro.

## [0.5.0] - 2026-09-24

### Added
- Streaming directo a disco para archivos grandes (>200 MB) en navegadores compatibles con la File System Access API (Chrome/Edge de escritorio): el receptor elige dónde guardar antes de empezar y los datos se escriben en el archivo a medida que llegan, sin acumularse en memoria. En navegadores sin soporte (Firefox, Safari) o para archivos más pequeños, sigue funcionando igual que antes (todo en memoria + botón de descarga al final).
- Protocolo de arranque `ready`: el emisor ahora espera una señal explícita del receptor antes de empezar a mandar datos, lo que permite al receptor prepararse (elegir dónde guardar) sin perder los primeros fragmentos.

## [0.4.0] - 2026-09-24

### Added
- Botón para cancelar la transferencia y elegir otro archivo, disponible en cuanto se selecciona uno.
- Velocidad de transferencia y tiempo restante estimado, mostrados en ambos lados durante el envío/recepción.
- El drop-zone ahora es accesible por teclado (`role="button"`, `tabindex`, `Enter`/`Espacio` abren el selector de archivo).
- Aviso al cerrar la pestaña (`beforeunload`) mientras hay una transferencia activa, para no perder el envío por accidente.

### Fixed
- El enlace de un solo uso ahora se invalida de verdad: una vez completada la entrega, cualquier intento posterior de abrirlo recibe un aviso de "enlace ya usado" en vez de reiniciar el envío desde cero o pisar la transferencia en curso.
- Se detecta cuando el receptor se desconecta a mitad de la copia (antes quedaba "enviando" sin avisar); ahora se muestra un aviso y se puede reintentar compartiendo el mismo enlace, ya que el envío solo se bloquea tras completarse con éxito.

## [0.3.0] - 2026-09-24

### Added
- Botón para alternar entre modo oscuro y claro (el CSS del tema claro ya existía pero no había forma de activarlo). La preferencia se guarda en `localStorage` y se aplica antes del primer render para evitar parpadeo.

### Fixed
- Control de flujo (backpressure) al enviar: el emisor ahora vigila `bufferedAmount` del canal de datos y pausa el envío de nuevos fragmentos hasta que el buffer drene, en vez de encolarlos sin límite. Evita picos de memoria y cortes de conexión con archivos grandes o conexiones lentas.

## [0.2.6] - 2026-09-24

### Added
- Favicon: una "F" pixel-art en la paleta del sitio, como SVG embebido en base64 dentro del propio `index.html` (sin archivos adicionales).

## [0.2.5] - 2026-09-24

### Fixed
- El texto se veía demasiado pequeño en móviles: se agregó un breakpoint (`max-width: 480px`) que aumenta los tamaños de fuente en pantallas de móvil.
- De paso se corrigió que el breakpoint que apilaba el QR y el link (antes en 380px) no cubría teléfonos reales de ~390-430px de ancho, lo que dejaba el input del enlace comprimido a unos pocos caracteres; ahora ambos ajustes comparten el mismo breakpoint de 480px.

## [0.2.4] - 2026-09-24

### Changed
- Fuente del texto general reemplazada de VT323 a Pixelify Sans: VT323 se veía demasiado angosta/delgada para leer cómodamente; Pixelify Sans mantiene el estilo pixel-art con más peso y legibilidad.

## [0.2.3] - 2026-09-24

### Fixed
- Renombrado `filerz.html` → `index.html`: hosts estáticos como Vercel sirven `/` buscando `index.html`, así que sin él la raíz del sitio devolvía 404.

## [0.2.2] - 2026-09-24

### Added
- README con descripción del proyecto, arquitectura, instrucciones de uso local y despliegue en Vercel.
- Licencia MIT.

## [0.2.1] - 2026-09-24

### Fixed
- Se detecta cuando `filerz.html` se abre directo desde el disco (`file://`) y se avisa con un mensaje claro, en vez de generar un enlace/QR roto que ningún otro dispositivo puede abrir.

## [0.2.0] - 2026-09-24

### Changed
- Rediseño completo de la interfaz con estética 8-bit/pixel art: tipografías pixeladas (Press Start 2P + VT323), bordes duros sin `border-radius`, sombras offset sin blur, paleta neón tipo arcade, barra de progreso segmentada estilo "health bar" y scanlines de CRT.

## [0.1.0] - 2026-09-24

### Added
- Primera versión funcional: transferencia peer-to-peer de archivos por WebRTC vía PeerJS.
- Generación de enlace de un solo uso y código QR (qrcodejs) para compartir la sesión.
- Barra de progreso en tiempo real tanto en el emisor como en el receptor.

[Unreleased]: https://github.com/rzazo24/filerz/compare/v0.12.0...HEAD
[0.12.0]: https://github.com/rzazo24/filerz/compare/v0.11.2...v0.12.0
[0.11.2]: https://github.com/rzazo24/filerz/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/rzazo24/filerz/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/rzazo24/filerz/compare/v0.10.5...v0.11.0
[0.10.5]: https://github.com/rzazo24/filerz/compare/v0.10.4...v0.10.5
[0.10.4]: https://github.com/rzazo24/filerz/compare/v0.10.3...v0.10.4
[0.10.3]: https://github.com/rzazo24/filerz/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/rzazo24/filerz/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/rzazo24/filerz/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/rzazo24/filerz/compare/v0.9.1...v0.10.0
[0.9.1]: https://github.com/rzazo24/filerz/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/rzazo24/filerz/compare/v0.8.5...v0.9.0
[0.8.5]: https://github.com/rzazo24/filerz/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/rzazo24/filerz/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/rzazo24/filerz/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/rzazo24/filerz/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/rzazo24/filerz/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/rzazo24/filerz/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/rzazo24/filerz/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/rzazo24/filerz/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/rzazo24/filerz/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/rzazo24/filerz/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/rzazo24/filerz/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/rzazo24/filerz/compare/v0.2.6...v0.3.0
[0.2.6]: https://github.com/rzazo24/filerz/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/rzazo24/filerz/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/rzazo24/filerz/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/rzazo24/filerz/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/rzazo24/filerz/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/rzazo24/filerz/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rzazo24/filerz/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rzazo24/filerz/releases/tag/v0.1.0
