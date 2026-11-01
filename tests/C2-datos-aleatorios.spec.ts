import { test, expect } from '@playwright/test';
import path from 'path';
import { generadorConSemilla } from '../helpers/aleatorio';

const pagina = 'file://' + path.resolve(__dirname, '../pages/c2-datos-aleatorios.html');

// La app solo registra a mayores de edad (edad >= 18).

// Versión inestable: la edad sale de Math.random() entre 0 y 99, sin semilla y sin
// tener en cuenta la regla. Si sale una edad menor de 18 (18 de 100 valores), la
// prueba falla. El mensaje de error no dice qué edad salió, así que el fallo no se
// puede reproducir a propósito.
test('C2 · edad aleatoria sin semilla (inestable)', async ({ page }) => {
  const edad = Math.floor(Math.random() * 100);
  await page.goto(pagina);
  await page.locator('#edad').fill(String(edad));
  await page.locator('#enviar').click();
  await expect(page.locator('#resultado')).toHaveText('Registro correcto');
});

// Versión estable: generador con semilla fija y valores solo dentro del dominio
// válido (18 a 99). Es reproducible: siempre usa la misma edad. A cambio, cubre
// menos valores; los casos límite (17 y 18) se probarían con pruebas propias.
test('C2 · edad con semilla y dentro del dominio válido (estable)', async ({ page }) => {
  const azar = generadorConSemilla(12345);
  const edad = 18 + Math.floor(azar() * 82);
  await page.goto(pagina);
  await page.locator('#edad').fill(String(edad));
  await page.locator('#enviar').click();
  await expect(page.locator('#resultado')).toHaveText('Registro correcto');
});
