import { test as base, expect } from '@playwright/test';

// Misma prueba, pero con presión opcional sobre el entorno. Sin variables, no cambia nada.
//  - CPU_THROTTLE: ralentiza la CPU del navegador (4 = 4 veces más lento). Usa el
//    protocolo de Chrome (CDP), solo en Chromium.
//  - LATENCIA_MS: retrasa cada petición a la API de Toolshop (localhost:8091) esa
//    cantidad de milisegundos antes de enviarla. Es un retraso por petición del
//    navegador: si el navegador hace una comprobación previa CORS (OPTIONS), también
//    se retrasa, así que el retraso efectivo de una llamada puede ser mayor.
//    La cifra es una decisión de diseño, no la latencia de ningún servicio real.
export const test = base.extend({
  page: async ({ page, context }, use) => {
    const rate = Number(process.env.CPU_THROTTLE ?? 1);
    if (rate > 1) {
      const sesion = await context.newCDPSession(page);
      await sesion.send('Emulation.setCPUThrottlingRate', { rate });
    }
    const latencia = Number(process.env.LATENCIA_MS ?? 0);
    if (latencia > 0) {
      await page.route('http://localhost:8091/**', async (route) => {
        await new Promise((r) => setTimeout(r, latencia));
        await route.continue();
      });
    }
    await use(page);
  },
});

export { expect };
export type { Page } from '@playwright/test';
