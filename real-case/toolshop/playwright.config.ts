import { defineConfig } from '@playwright/test';

// Caso real: pruebas contra Practice Software Testing (Toolshop) en local.
// La aplicación NO está en este repo: se clona aparte (licencia "solo referencia")
// y se levanta con `docker compose up -d`. Aquí solo viven las pruebas.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'off',
  },
});
