import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'list',
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4173',
    // Fija el idioma del navegador: la app auto-detecta el idioma desde
    // navigator.language si no hay nada en localStorage, así que sin esto los
    // tests dependerían del locale de la máquina que los corre.
    locale: 'es-ES',
    // Para poder debuggear fallos en CI sin acceso directo al navegador.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
