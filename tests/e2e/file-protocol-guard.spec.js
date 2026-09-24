import { test, expect } from '@playwright/test';
import path from 'node:path';

// Regresión: abrir index.html con doble clic (file://) rompía location.origin
// y generaba un enlace/QR roto en silencio. Ver CLAUDE.md > Commands.
test('abrir por file:// muestra un aviso y no genera enlace ni QR', async ({ page }) => {
  const filePath = path.resolve('index.html');
  await page.goto('file://' + filePath);

  await page.setInputFiles('#fileInput', {
    name: 'dummy.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'),
  });

  await expect(page.locator('#senderStatus')).toHaveClass(/error/);
  await expect(page.locator('.share.show')).toHaveCount(0);
});
