import { test, expect } from '@playwright/test';

// Este test golpea el broker público de PeerJS Cloud de verdad (señalización),
// así que depende de red y puede ser más lento/flaky que el resto de la suite.
test('transferencia completa de extremo a extremo', async ({ browser }) => {
  const senderCtx = await browser.newContext();
  const sender = await senderCtx.newPage();
  await sender.goto('/');
  await sender.setInputFiles('#fileInput', {
    name: 'dummy.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('contenido de prueba end-to-end'),
  });
  await expect(sender.locator('.share.show')).toBeVisible();
  const link = await sender.inputValue('#linkInput');

  const receiverCtx = await browser.newContext();
  const receiver = await receiverCtx.newPage();
  await receiver.goto(link);

  await expect(receiver.locator('#downloadBtn')).toBeVisible({ timeout: 20000 });
  await expect(receiver.locator('#receiverStatus')).toHaveClass(/ready/);
  await expect(sender.locator('#senderStatus')).toHaveClass(/ready/, { timeout: 20000 });

  await senderCtx.close();
  await receiverCtx.close();
});

test('un enlace ya completado rechaza una segunda conexión', async ({ browser }) => {
  const senderCtx = await browser.newContext();
  const sender = await senderCtx.newPage();
  await sender.goto('/');
  await sender.setInputFiles('#fileInput', {
    name: 'dummy.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'),
  });
  await expect(sender.locator('.share.show')).toBeVisible();
  const link = await sender.inputValue('#linkInput');

  const firstCtx = await browser.newContext();
  const first = await firstCtx.newPage();
  await first.goto(link);
  await expect(first.locator('#downloadBtn')).toBeVisible({ timeout: 20000 });

  const secondCtx = await browser.newContext();
  const second = await secondCtx.newPage();
  await second.goto(link);
  await expect(second.locator('#receiverStatus')).toHaveClass(/error/, { timeout: 20000 });

  await senderCtx.close();
  await firstCtx.close();
  await secondCtx.close();
});
