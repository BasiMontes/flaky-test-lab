import { test as base, expect } from '@playwright/test';

// Misma prueba, pero con la CPU del navegador ralentizada si se pide con la
// variable CPU_THROTTLE (4 = el navegador va 4 veces más lento). Sin la variable,
// no cambia nada. Se hace con el protocolo de Chrome (CDP), solo en Chromium.
export const test = base.extend({
  page: async ({ page, context }, use) => {
    const rate = Number(process.env.CPU_THROTTLE ?? 1);
    if (rate > 1) {
      const sesion = await context.newCDPSession(page);
      await sesion.send('Emulation.setCPUThrottlingRate', { rate });
    }
    await use(page);
  },
});

export { expect };
export type { Page } from '@playwright/test';
