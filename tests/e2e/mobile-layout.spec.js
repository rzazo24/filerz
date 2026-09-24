import { test, expect, devices } from '@playwright/test';

// Se toma el viewport/UA/touch de iPhone 13 pero se descarta
// defaultBrowserType ('webkit'): solo interesa emular el ancho de pantalla
// real de un teléfono para revisar overflow, no probar el motor de Safari, y
// WebKit no tiene sus dependencias de sistema instaladas en este entorno.
const { defaultBrowserType, ...iPhone13Viewport } = devices['iPhone 13'];
test.use({ ...iPhone13Viewport });

// Regresión: el input del enlace/código y su botón "Copiar" se desbordaban de
// la tarjeta en teléfonos reales (~390-430px). Ver CLAUDE.md > Styling.
test('en móvil, la tarjeta no desborda horizontalmente al mostrar el enlace', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('#fileInput', {
    name: 'dummy.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'),
  });
  await expect(page.locator('.share.show')).toBeVisible();

  const overflowing = await page.locator('.card').evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflowing).toBe(false);
});

test('en móvil, el encabezado con los 4 botones no desborda la tarjeta', async ({ page }) => {
  await page.goto('/');
  const overflowing = await page.locator('.top').evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflowing).toBe(false);
});
