import { test, expect } from '@playwright/test';
import jsQR from 'jsqr';

test('elegir un archivo genera enlace, código corto y QR válido', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('#fileInput', {
    name: 'dummy.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hola filerz'),
  });

  await expect(page.locator('.share.show')).toBeVisible();

  const link = await page.inputValue('#linkInput');
  const code = await page.inputValue('#codeOnlyInput');

  expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  expect(link).toContain('#r=' + code);

  const qr = await page.evaluate(() => {
    const canvas = document.querySelector('#qrChip canvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height, data: Array.from(imageData.data) };
  });

  const decoded = jsQR(Uint8ClampedArray.from(qr.data), qr.width, qr.height);
  expect(decoded?.data).toBe(link);
});

test('el botón cancelar vuelve a la pantalla de elegir archivo', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('#fileInput', {
    name: 'dummy.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'),
  });
  await expect(page.locator('.share.show')).toBeVisible();

  await page.click('#cancelBtn');

  await expect(page.locator('.share.show')).toHaveCount(0);
  await expect(page.locator('#receiveAlt')).toBeVisible();
});
