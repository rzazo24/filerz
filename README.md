# Filerz

Transferencia de archivos peer-to-peer, al estilo [file.pizza](https://file.pizza): el archivo viaja directo de un navegador a otro por WebRTC, sin subirse nunca a ningún servidor propio.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rzazo24/filerz)

## Qué hace

- El emisor elige un archivo y se genera un **enlace de un solo uso** + un **código QR**.
- El receptor abre el enlace (o escanea el QR) y la transferencia arranca sola.
- Barra de progreso en ambos lados mientras dura la copia.
- El archivo nunca pasa por un backend: viaja directo entre los dos navegadores por un `RTCDataChannel`.

## Cómo funciona

Todo vive en un único archivo HTML autocontenido (`filerz.html`), sin paso de build ni dependencias instaladas:

- **[PeerJS](https://peerjs.com/)** envuelve WebRTC y resuelve la señalización inicial (el intercambio de SDP/ICE necesario para que los dos navegadores se encuentren) usando el broker público de **PeerJS Cloud**. Una vez establecida la conexión, los datos ya no pasan por ese broker.
- **[qrcodejs](https://github.com/davidshimjs/qrcodejs)** genera el QR con el enlace de la sesión.
- El archivo se envía en fragmentos de 16 KB por el canal de datos, y el receptor los va reensamblando en memoria hasta poder generar el `Blob` final para descargar.

Ambas librerías se cargan por CDN (jsDelivr / cdnjs), así que el sitio se puede servir tal cual, sin `npm install` ni bundlers.

## Requisitos

Filerz **debe servirse por HTTP o HTTPS** (un servidor local, o desplegado). Abrir `filerz.html` con doble clic (protocolo `file://`) rompe la generación del enlace/QR, porque WebRTC y `location.origin` no se comportan igual ahí.

## Probarlo en local

```bash
python3 -m http.server 8080
# o: npx serve
```

Abrí `http://localhost:8080/filerz.html` en dos pestañas (o dos dispositivos en la misma red) para simular emisor y receptor.

## Desplegar

Pensado para desplegarse como sitio estático en **Vercel**: no hace falta build command ni configuración adicional, basta con importar el repo. También podés usar el botón de arriba para clonarlo y desplegarlo directo.

## Notas

- La señalización usa el broker público de PeerJS Cloud. Si en algún momento hace falta más control (privacidad, límites de uso), se puede levantar un [PeerServer](https://github.com/peers/peerjs-server) propio.
- Sin backend propio, sin base de datos, sin analítica: el archivo no toca ningún servidor intermedio.

## Licencia

[MIT](LICENSE)
