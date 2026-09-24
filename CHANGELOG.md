# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.2.6] - 2026-09-24

### Added
- Favicon: una "F" pixel-art en la paleta del sitio, como SVG embebido en base64 dentro del propio `index.html` (sin archivos adicionales).

## [0.2.5] - 2026-09-24

### Fixed
- El texto se veía demasiado chico en móviles: se agregó un breakpoint (`max-width: 480px`) que aumenta los tamaños de fuente en pantallas de celular.
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

[Unreleased]: https://github.com/rzazo24/filerz/compare/v0.2.6...HEAD
[0.2.6]: https://github.com/rzazo24/filerz/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/rzazo24/filerz/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/rzazo24/filerz/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/rzazo24/filerz/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/rzazo24/filerz/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/rzazo24/filerz/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rzazo24/filerz/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rzazo24/filerz/releases/tag/v0.1.0
