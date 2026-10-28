import { test, expect } from '@playwright/test';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/a1-espera-fija.html');

// Versión inestable: espera fija de 500 ms y lectura puntual (sin reintentos).
// El resultado tarda entre 0 y 1500 ms, así que a veces todavía no está listo.
test('A1 · espera fija (inestable)', async ({ page }) => {
  await page.goto(pagina);
  await page.click('#cargar');
  await page.waitForTimeout(500);
  const texto = await page.locator('#resultado').textContent();
  expect(texto).toBe('Resultado listo');
});

// Versión estable: espera por condición (el aserto reintenta hasta el timeout).
test('A1 · espera por condición (estable)', async ({ page }) => {
  await page.goto(pagina);
  await page.click('#cargar');
  await expect(page.locator('#resultado')).toHaveText('Resultado listo');
});
