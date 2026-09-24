# Filerz

**English** | [Español](README.md)

Peer-to-peer file transfer, [file.pizza](https://file.pizza)-style: the file travels straight from one browser to another over WebRTC, never uploaded to any server of ours.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rzazo24/filerz)

## What it does

- The sender picks a file and a **one-time link** + a **QR code** are generated.
- Right now it's **one file per transfer** (no multi-select yet); to send several, zip them up and share that file instead.
- The recipient opens the link (or scans the QR code) and the transfer starts on its own. Without the link handy, they can also type the code directly on the page or scan the QR with the device's camera, no external app needed.
- A progress bar on both sides, with **transfer speed and estimated time left**, while the copy is running.
- A **cancel** button to stop the transfer at any point and pick another file. If the recipient disconnects mid-transfer, you can retry by sharing the same link: it only stops working once the transfer actually completes.
- Once the transfer finishes, a **Reload** button appears on both sides: on the sender it goes back to the file-picker screen, and on the recipient it clears the link from the URL before reloading, so it doesn't retry connecting to a link that's already been used.
- The file never touches a backend: it travels directly between the two browsers over an `RTCDataChannel`.
- **Light/dark theme** with a dedicated toggle, and a keyboard-accessible drop zone.
- It's an **installable PWA**: you can add it to your home screen (or install it as a desktop app), the interface loads instantly thanks to the service worker (even offline), and it shows a banner to reload when a new version is available.
- A **help** button (`?`) with usage instructions and a link to this repository.
- Interface in **Spanish or English**: it detects the browser's language on load and can be switched with the ES/EN button in the header (remembered in `localStorage`). Error messages that travel between sender and recipient use codes, not pre-translated text, so each side sees the interface in its own language regardless of the other's.

## How it works

Everything lives in a single self-contained HTML file (`index.html`), with no build step or installed dependencies:

- **[PeerJS](https://peerjs.com/)** wraps WebRTC and handles the initial signaling (the SDP/ICE exchange the two browsers need to find each other) using the public **PeerJS Cloud** broker. Once the connection is established, data no longer goes through that broker. Instead of the long UUID it assigns by default, a short 8-character uppercase-only ID is generated, split into two blocks (`ABCD-1234`), so the link stays short and easy to read or type by hand; visually confusable characters (`0/O/1/I/L`) are excluded, and using a single letter case removes any upper/lowercase guesswork (with an automatic retry if it happens to collide with one already in use).
- **[qrcodejs](https://github.com/davidshimjs/qrcodejs)** generates the QR code with the session link.
- **[jsQR](https://github.com/cozmo/jsQR)** decodes QR codes live from the camera (`getUserMedia`) so you can scan another device's code without leaving the page. If the camera isn't available or the library fails to load, a clear message is shown and typing the code by hand is still an option.
- The file is sent in 16 KB chunks over the data channel, with flow control so the outgoing buffer never gets flooded. For files over 200 MB in supporting browsers (desktop Chrome/Edge), the recipient writes straight to disk using the File System Access API; otherwise, chunks are reassembled in memory until the final `Blob` is ready to download.

All libraries load from a CDN (jsDelivr / cdnjs), so the site can be served as-is, no `npm install` or bundlers needed.

- `manifest.json` describes the installable app (icons, colors, name), and `sw.js` is the service worker: it caches the shell (`index.html`, the manifest, and the icons) so the app opens instantly and keeps working offline. The transfer itself still needs a network connection, of course — the service worker doesn't cache transferred files or intercept PeerJS signaling.

## Requirements

Filerz **must be served over HTTP or HTTPS** (a local server, or deployed). Opening `index.html` by double-clicking it (the `file://` protocol) breaks link/QR generation, because WebRTC and `location.origin` don't behave the same way there.

## Try it locally

```bash
python3 -m http.server 8080
# or: npx serve
```

Open `http://localhost:8080` in two tabs (or two devices on the same network) to simulate a sender and a recipient.

## Deploy

Meant to be deployed as a static site on **Vercel**: no build command or extra configuration needed, just import the repo. You can also use the button above to clone and deploy it directly.

For **Vercel Analytics** to start collecting data, you need to enable "Web Analytics" for the project from the Vercel dashboard (the project's **Analytics** tab). Without that step, the script (`/_vercel/insights/script.js`) doesn't do anything.

## Notes

- Signaling uses the public PeerJS Cloud broker. If more control is ever needed (privacy, usage limits), a self-hosted [PeerServer](https://github.com/peers/peerjs-server) can be set up.
- No backend or database of our own: the file never touches an intermediate server. [Vercel Analytics](https://vercel.com/docs/analytics) is used (visits and page views, no cookies or personal data) to know whether anyone's using the app — it only activates if Web Analytics is enabled for the project on Vercel; otherwise, the script simply loads nothing.
- Only public STUN is used (no TURN): on very restrictive networks (symmetric NAT, corporate firewalls), the direct connection can fail. Adding TURN would fix that, but it would mean the file passes through a third-party relay in those cases, which clashes with the idea that it "never passes through an intermediate server" — so, on purpose, it isn't included.

## License

[MIT](LICENSE)
