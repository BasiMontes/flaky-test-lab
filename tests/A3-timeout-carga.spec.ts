import { test, expect } from '@playwright/test';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/a3-timeout-carga.html');

// Versión inestable: la aserción usa el timeout por defecto (5 s).
// El panel aparece entre 2 y 6 s después del clic, así que a veces
// supera el timeout y la prueba falla aunque la página funcione bien.
test('A3 · timeout por defecto de 5 s (inestable)', async ({ page }) => {
  await page.goto(pagina);
  await page.click('#cargar');
  await expect(page.locator('#panel')).toBeVisible();
});

// Versión estable: el timeout de la aserción cubre el peor caso de carga (6 s).
test('A3 · timeout ajustado a la carga (estable)', async ({ page }) => {
  await page.goto(pagina);
  await page.click('#cargar');
  await expect(page.locator('#panel')).toBeVisible({ timeout: 10000 });
});
