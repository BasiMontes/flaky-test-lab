import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './helpers/limpiar-estado.ts',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'off',
  },
});
