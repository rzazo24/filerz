// Recalcula CACHE_NAME en sw.js a partir de un hash del contenido real de los
// archivos listados en SHELL_ASSETS (la única fuente de verdad: no hay una
// segunda lista de archivos que mantener sincronizada acá). Se corre en CI en
// cada push a main (ver .github/workflows/test.yml); también se puede correr
// a mano con `npm run update-sw-cache`.
//
// Por qué existe: el navegador solo nota una versión nueva del service worker
// cuando los BYTES de sw.js cambian. Antes había que acordarse de subir un
// número a mano en cada deploy que tocara el shell; ahora CACHE_NAME es un
// hash del contenido real, así que cambia si y solo si el shell cambió de
// verdad, sin depender de que nadie se acuerde de nada.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const swPath = path.join(repoRoot, 'sw.js');
const swSource = readFileSync(swPath, 'utf8');

function extractShellAssets(source) {
  const start = source.indexOf('const SHELL_ASSETS = [');
  if (start === -1) throw new Error('No se encontró "const SHELL_ASSETS = [" en sw.js');
  const end = source.indexOf('];', start);
  if (end === -1) throw new Error('No se encontró el cierre "];" de SHELL_ASSETS en sw.js');
  const arraySrc = source.slice(start, end + 2);
  return new Function(`${arraySrc}\nreturn SHELL_ASSETS;`)();
}

function toLocalPath(urlPath) {
  return urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
}

const shellAssets = extractShellAssets(swSource);
const localPaths = [...new Set(shellAssets.map(toLocalPath))].sort();

const hash = createHash('sha256');
for (const relPath of localPaths) {
  hash.update(relPath); // que renombrar o quitar un archivo del shell también cambie el hash
  hash.update(readFileSync(path.join(repoRoot, relPath)));
}
const newCacheName = `filerz-shell-${hash.digest('hex').slice(0, 12)}`;

const CACHE_NAME_RE = /const CACHE_NAME = '[^']*';/;
if (!CACHE_NAME_RE.test(swSource)) {
  throw new Error('No se encontró "const CACHE_NAME = \'...\';" en sw.js');
}
const updated = swSource.replace(CACHE_NAME_RE, `const CACHE_NAME = '${newCacheName}';`);

if (updated !== swSource) {
  writeFileSync(swPath, updated);
  console.log(`sw.js actualizado: CACHE_NAME -> ${newCacheName}`);
} else {
  console.log(`sw.js sin cambios: CACHE_NAME ya es ${newCacheName}`);
}
