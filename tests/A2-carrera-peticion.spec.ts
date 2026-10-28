import { test, expect } from '@playwright/test';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/a2-carrera-peticion.html');

// Versión inestable: el botón está habilitado antes de que llegue el usuario.
// Si el clic ocurre antes de la respuesta, se guarda "pendiente".
// El texto se fija en el momento del clic, así que el aserto no puede
// esperar a que cambie: falla de forma determinista cuando hay carrera.
test('A2 · botón habilitado antes de la petición (inestable)', async ({ page }) => {
  await page.goto(pagina);
  await page.click('#guardar');
  await expect(page.locator('#resultado')).toHaveText('Guardado: Ana');
});

// Versión estable: se espera a que el botón esté habilitado (la petición ha terminado).
test('A2 · botón habilitado tras la petición (estable)', async ({ page }) => {
  await page.goto(pagina + '?estable=1');
  await expect(page.locator('#guardar')).toBeEnabled();
  await page.click('#guardar');
  await expect(page.locator('#resultado')).toHaveText('Guardado: Ana');
});
