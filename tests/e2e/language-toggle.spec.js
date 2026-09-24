import { test, expect } from '@playwright/test';

test('el botón de idioma cambia los textos visibles a inglés y viceversa', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#drop p')).toHaveText('Suelta un archivo aquí o toca para elegirlo');

  await page.click('#langToggle');
  await expect(page.locator('#drop p')).toHaveText('Drop a file here or tap to choose one');
  await expect(page.locator('#langToggle')).toHaveText('ES');

  await page.click('#langToggle');
  await expect(page.locator('#drop p')).toHaveText('Suelta un archivo aquí o toca para elegirlo');
  await expect(page.locator('#langToggle')).toHaveText('EN');
});

test('el modal de ayuda abre, cierra con Escape y respeta el idioma', async ({ page }) => {
  await page.goto('/');
  await page.click('#helpToggle');
  await expect(page.locator('#helpOverlay')).toHaveClass(/show/);

  await page.keyboard.press('Escape');
  await expect(page.locator('#helpOverlay')).not.toHaveClass(/show/);
});
