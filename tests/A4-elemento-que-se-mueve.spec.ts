import { test, expect } from '@playwright/test';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/a4-elemento-que-se-mueve.html');

// Ambas versiones hacen lo mismo: escriben un nombre (paso intermedio de unos
// 150 ms: 3 teclas con 50 ms de pausa) y pulsan "Aceptar". Solo cambia cómo se pulsa.
// El aviso aparece en un momento aleatorio entre 0 y 600 ms y mueve el botón 120 px.

// Versión inestable: lee la posición del botón antes del paso intermedio y hace
// clic en esas coordenadas después. Si el aviso aparece durante la escritura,
// el botón ya no está donde se leyó y el clic cae en otro sitio.
test('A4 · clic en coordenadas leídas antes (inestable)', async ({ page }) => {
  await page.goto(pagina);
  const caja = await page.locator('#aceptar').boundingBox();
  await page.locator('#nombre').pressSequentially('Ana', { delay: 50 });
  await page.mouse.click(caja!.x + caja!.width / 2, caja!.y + caja!.height / 2);
  await expect(page.locator('#resultado')).toHaveText('Aceptado: Ana');
});

// Versión estable: el clic normal de Playwright calcula la posición en el momento
// de pulsar y espera a que el botón esté estable y no tapado.
test('A4 · clic normal sobre el botón (estable)', async ({ page }) => {
  await page.goto(pagina);
  await page.locator('#nombre').pressSequentially('Ana', { delay: 50 });
  await page.locator('#aceptar').click();
  await expect(page.locator('#resultado')).toHaveText('Aceptado: Ana');
});
