# Filerz

Transferencia de archivos peer-to-peer, al estilo [file.pizza](https://file.pizza): el archivo viaja directo de un navegador a otro por WebRTC, sin subirse nunca a ningún servidor propio.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rzazo24/filerz)

## Qué hace

- El emisor elige un archivo y se genera un **enlace de un solo uso** + un **código QR**.
- El receptor abre el enlace (o escanea el QR) y la transferencia arranca sola.
- Barra de progreso en ambos lados mientras dura la copia.
- El archivo nunca pasa por un backend: viaja directo entre los dos navegadores por un `RTCDataChannel`.
- Es una **PWA instalable**: se puede agregar a la pantalla de inicio (o instalar como app de escritorio) y la interfaz carga al instante gracias al service worker, incluso sin conexión.
- Botón de **ayuda** (`?`) con instrucciones de uso y el link a este repositorio.

## Cómo funciona

Todo vive en un único archivo HTML autocontenido (`index.html`), sin paso de build ni dependencias instaladas:

- **[PeerJS](https://peerjs.com/)** envuelve WebRTC y resuelve la señalización inicial (el intercambio de SDP/ICE necesario para que los dos navegadores se encuentren) usando el broker público de **PeerJS Cloud**. Una vez establecida la conexión, los datos ya no pasan por ese broker.
- **[qrcodejs](https://github.com/davidshimjs/qrcodejs)** genera el QR con el enlace de la sesión.
- El archivo se envía en fragmentos de 16 KB por el canal de datos, con control de flujo para no saturar el buffer de salida. Para archivos de más de 200 MB en navegadores compatibles (Chrome/Edge de escritorio), el receptor escribe directo a disco con la File System Access API; en el resto de los casos, los fragmentos se reensamblan en memoria hasta generar el `Blob` final para descargar.

Ambas librerías se cargan por CDN (jsDelivr / cdnjs), así que el sitio se puede servir tal cual, sin `npm install` ni bundlers.

- `manifest.json` describe la app instalable (íconos, colores, nombre) y `sw.js` es el service worker: cachea el shell (`index.html`, el manifest y los íconos) para que la app abra al instante y funcione incluso sin conexión. La transferencia en sí sigue necesitando red, claro — el service worker no cachea archivos transferidos ni intercepta la señalización de PeerJS.

## Requisitos

Filerz **debe servirse por HTTP o HTTPS** (un servidor local, o desplegado). Abrir `index.html` con doble clic (protocolo `file://`) rompe la generación del enlace/QR, porque WebRTC y `location.origin` no se comportan igual ahí.

## Probarlo en local

```bash
python3 -m http.server 8080
# o: npx serve
```

Abrí `http://localhost:8080` en dos pestañas (o dos dispositivos en la misma red) para simular emisor y receptor.

## Desplegar

Pensado para desplegarse como sitio estático en **Vercel**: no hace falta build command ni configuración adicional, basta con importar el repo. También podés usar el botón de arriba para clonarlo y desplegarlo directo.

Para que **Vercel Analytics** empiece a recolectar datos, hay que habilitar "Web Analytics" para el proyecto desde el dashboard de Vercel (pestaña **Analytics** del proyecto). Sin ese paso, el script (`/_vercel/insights/script.js`) no hace nada.

## Notas

- La señalización usa el broker público de PeerJS Cloud. Si en algún momento hace falta más control (privacidad, límites de uso), se puede levantar un [PeerServer](https://github.com/peers/peerjs-server) propio.
- Sin backend propio ni base de datos: el archivo no toca ningún servidor intermedio. Sí se usa [Vercel Analytics](https://vercel.com/docs/analytics) (visitas y páginas vistas, sin cookies ni datos personales) para saber si alguien usa la app — se activa solo si el proyecto tiene Web Analytics habilitado en Vercel; si no, el script simplemente no carga nada.
- Solo se usa STUN público (sin TURN): en redes muy restrictivas (NAT simétrico, firewalls corporativos) la conexión directa puede fallar. Agregar TURN evitaría eso, pero implicaría que el archivo pase por un relay de terceros en esos casos, lo cual choca con la idea de "nunca pasa por un servidor intermedio" — por eso, a propósito, no está incluido.

## Licencia

[MIT](LICENSE)
