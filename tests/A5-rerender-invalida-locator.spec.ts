import { test, expect } from '@playwright/test';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/a5-rerender-invalida-locator.html');

// Ambas versiones hacen lo mismo: escriben un nombre (paso intermedio de unos
// 150 ms: 3 teclas con 50 ms de pausa) y pulsan "Guardar". Solo cambia cómo se
// obtiene el botón. La zona del botón se repinta en un momento aleatorio entre
// 0 y 600 ms: el nodo antiguo se descarta y aparece otro con el mismo id.

// Versión inestable: guarda un ElementHandle (referencia a un nodo concreto del DOM)
// antes del paso intermedio y lo usa después. Si el repintado ocurre entre medias,
// el handle apunta a un nodo que ya no está en la página.
test('A5 · handle guardado antes del repintado (inestable)', async ({ page }) => {
  await page.goto(pagina);
  const boton = await page.$('#guardar');
  await page.locator('#nombre').pressSequentially('Ana', { delay: 50 });
  await boton!.click();
  await expect(page.locator('#resultado')).toHaveText('Guardado: Ana');
});

// Versión estable: el locator no guarda ningún nodo, vuelve a buscar el botón en
// el momento de pulsar.
test('A5 · locator que se resuelve al pulsar (estable)', async ({ page }) => {
  await page.goto(pagina);
  await page.locator('#nombre').pressSequentially('Ana', { delay: 50 });
  await page.locator('#guardar').click();
  await expect(page.locator('#resultado')).toHaveText('Guardado: Ana');
});
