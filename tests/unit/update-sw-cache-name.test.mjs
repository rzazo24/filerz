// Corre el script real contra el repo real (no un fixture aislado): en el
// estado normal del repo esto es un no-op, exactamente lo que CI hace en cada
// push. Si algún día deja de serlo, es porque alguien tocó un archivo del
// shell sin correr el script — falla acá antes que en producción.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const scriptPath = fileURLToPath(new URL('../../scripts/update-sw-cache-name.mjs', import.meta.url));
const swPath = fileURLToPath(new URL('../../sw.js', import.meta.url));

test('correr el script dos veces seguidas es un no-op (idempotente)', () => {
  execFileSync('node', [scriptPath], { cwd: repoRoot });
  const first = readFileSync(swPath, 'utf8');
  execFileSync('node', [scriptPath], { cwd: repoRoot });
  const second = readFileSync(swPath, 'utf8');
  assert.equal(second, first);
});

test('CACHE_NAME queda con el formato filerz-shell-<hash de 12 hex>', () => {
  const sw = readFileSync(swPath, 'utf8');
  const match = sw.match(/const CACHE_NAME = '([^']*)';/);
  assert.ok(match, 'no se encontró CACHE_NAME en sw.js');
  assert.match(match[1], /^filerz-shell-[0-9a-f]{12}$/);
});
