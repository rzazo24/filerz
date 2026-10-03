// Estos tests no importan index.html como módulo (no lo es: es un IIFE dentro
// de un <script> de una página HTML autocontenida, a propósito, ver CLAUDE.md).
// En su lugar, extraen el código fuente de funciones puras conocidas por texto
// y lo evalúan de forma aislada. Si algún día se renombra una de las funciones
// o constantes ancla, estos tests van a fallar con un error claro señalando
// qué marcador no se encontró, en vez de fallar en silencio.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const htmlPath = fileURLToPath(new URL('../../index.html', import.meta.url));
const html = readFileSync(htmlPath, 'utf8');

function extract(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) throw new Error(`No se encontró el marcador de inicio: "${startMarker}"`);
  const end = html.indexOf(endMarker, start);
  if (end === -1) throw new Error(`No se encontró el marcador de fin: "${endMarker}"`);
  return html.slice(start, end);
}

describe('I18N (paridad es/en)', () => {
  const src = extract('const I18N = {', '\n  const LANG_STORAGE_KEY');
  const I18N = new Function(`${src}\n  return I18N;`)();

  test('es y en tienen exactamente las mismas claves', () => {
    assert.deepEqual(Object.keys(I18N.en).sort(), Object.keys(I18N.es).sort());
  });

  test('ningún valor de traducción está vacío', () => {
    for (const lang of ['es', 'en']) {
      for (const [key, value] of Object.entries(I18N[lang])) {
        assert.ok(typeof value === 'string' && value.trim().length > 0, `${lang}.${key} está vacío`);
      }
    }
  });
});

describe('generateShortId', () => {
  const src = extract('const SHORT_ID_ALPHABET', '\n  let currentStatusKey');
  const { generateShortId, SHORT_ID_ALPHABET } = new Function(`${src}\n  return { generateShortId, SHORT_ID_ALPHABET };`)();

  test('tiene el formato XXXX-XXXX', () => {
    assert.match(generateShortId(), /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  test('el alfabeto no incluye caracteres ambiguos', () => {
    for (const ch of ['0', 'O', '1', 'I', 'L']) {
      assert.ok(!SHORT_ID_ALPHABET.includes(ch), `el alfabeto no debería incluir "${ch}"`);
    }
  });

  test('100 IDs generados son distintos entre sí', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateShortId()));
    assert.equal(ids.size, 100);
  });
});

describe('normalizeCode', () => {
  const src = extract('function normalizeCode(raw) {', '\n\n  function goToReceiveCode');
  const { normalizeCode } = new Function(`${src}\n  return { normalizeCode };`)();

  test('un código suelto se pasa a mayúsculas', () => {
    assert.equal(normalizeCode('abcd-1234'), 'ABCD-1234');
  });

  test('extrae el código del hash si se pega una URL completa', () => {
    assert.equal(normalizeCode('https://filerz.vercel.app/#r=abcd-1234'), 'ABCD-1234');
  });

  test('recorta espacios en blanco alrededor', () => {
    assert.equal(normalizeCode('  abcd-1234  '), 'ABCD-1234');
  });

  test('input vacío o nulo devuelve string vacío', () => {
    assert.equal(normalizeCode(''), '');
    assert.equal(normalizeCode(null), '');
  });
});

describe('PEER_OPTIONS (config ICE)', () => {
  const src = extract('const PEER_OPTIONS = {', '\n  const params = new URLSearchParams');
  const { PEER_OPTIONS } = new Function(`${src}\n  return { PEER_OPTIONS };`)();
  const servers = PEER_OPTIONS.config.iceServers;
  const urls = servers.flatMap((s) => [].concat(s.urls));

  // Regresión: sin config propia, PeerJS cae en su TURN público por defecto,
  // cuyos hostnames ya no resuelven; las conexiones entre redes restrictivas
  // (p. ej. iPhone con datos móviles) fallaban sin ningún aviso.
  test('incluye un STUN y un TURN propio con credenciales', () => {
    assert.ok(urls.some((u) => u.startsWith('stun:')), 'falta un servidor STUN');
    const turn = servers.find((s) => [].concat(s.urls).some((u) => u.startsWith('turn:')));
    assert.ok(turn, 'falta un servidor TURN');
    assert.ok(turn.username && turn.credential, 'el TURN necesita username y credential');
  });

  test('el TURN ofrece UDP y TCP (TCP sirve cuando una red bloquea UDP)', () => {
    assert.ok(urls.some((u) => u.startsWith('turn:') && u.includes('transport=udp')));
    assert.ok(urls.some((u) => u.startsWith('turn:') && u.includes('transport=tcp')));
  });

  test('no depende del TURN público de PeerJS (ya no existe)', () => {
    assert.ok(!urls.some((u) => u.includes('peerjs.com')));
  });
});

describe('Peer() recibe PEER_OPTIONS', () => {
  test('ningún new Peer(...) usa la config por defecto de PeerJS', () => {
    const calls = html.match(/new Peer\(.*\)/g) || [];
    assert.ok(calls.length >= 2, 'se esperaban al menos 2 llamadas a new Peer(');
    for (const call of calls) {
      assert.ok(call.includes('PEER_OPTIONS'), `${call} no pasa PEER_OPTIONS`);
    }
  });
});
