import { defineConfig } from '@playwright/test';

// Versiones "ingenuas" a propósito: usan los patrones que el catálogo identifica
// como causa de inestabilidad. Config aparte para no mezclarlas con las pruebas
// bien escritas (tests/), que deben seguir siendo la referencia estable.
export default defineConfig({
  testDir: './ingenuas',
  globalSetup: './herramientas/limpiar-estado.ts',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'off',
  },
});
