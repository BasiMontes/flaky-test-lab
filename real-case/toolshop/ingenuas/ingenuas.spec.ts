import fs from 'fs';
import path from 'path';
import { test, expect, Page } from '../tests/base';
import { hastaElPago } from '../tests/flujo';

// Seis pruebas escritas A PROPÓSITO con el patrón malo de una causa del catálogo,
// contra la aplicación real. Sirven para medir si esas causas aparecen en una
// aplicación de verdad y con qué tasa. Que fallen NO es un hallazgo sobre Toolshop:
// es la prueba la que está mal escrita. Las versiones correctas son P1 a P6.
//
// Hipótesis (cualitativas; no se predicen cifras porque no se conocen los tiempos):
//  N1 falla casi siempre o siempre: cuenta antes de que Angular pinte la lista.
//  N2 falla a veces: 500 ms fijos pueden no bastar si el servidor tarda más.
//  N3 falla casi siempre: networkidle no esperó al contenido del detalle (se vio
//     al explorar). Puede ser determinista y no intermitente.
//  N4 falla a veces o nunca: un timeout de 500 ms solo falla si la carga lo supera.
//  N5 aprueba sin comprobar nada si la lista está vacía (como D1). Se registra
//     cuántos precios vio cada ejecución.
//  N6 falla a veces: navegar a /checkout sin esperar al carrito puede cortar la
//     petición que lo crea.

const tarjetas = (page: Page) => page.locator('[data-test^="product-01"]');
const nombres = (page: Page) => page.locator('[data-test="product-name"]');

const carpetaN5 = path.resolve(__dirname, '../estado/n5');

test('N1 · cuenta las tarjetas justo después de cargar (A1)', async ({ page }) => {
  await page.goto('/');
  const n = await tarjetas(page).count();
  expect(n).toBe(9);
});

test('N2 · espera fija de 500 ms tras buscar (A1)', async ({ page }) => {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9);
  await page.locator('[data-test="search-query"]').fill('pliers');
  await page.locator('[data-test="search-submit"]').click();
  await page.waitForTimeout(500);
  const textos = await nombres(page).allTextContents();
  expect(textos.length).toBeGreaterThan(0);
  expect(textos.every((t) => /pliers/i.test(t))).toBe(true);
});

test('N3 · da por cargado el detalle tras networkidle (A2)', async ({ page }) => {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9);
  await tarjetas(page).first().click();
  await page.waitForLoadState('networkidle');
  expect(await nombres(page).isVisible()).toBe(true);
});

test('N4 · timeout de 500 ms ajustado a la carga (A3)', async ({ page }) => {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9, { timeout: 500 });
});

test('N5 · recorre los precios con .all() sin esperar (D1)', async ({ page }, testInfo) => {
  await page.goto('/');
  const precios = await page.locator('[data-test="product-price"]').all();
  fs.mkdirSync(carpetaN5, { recursive: true });
  fs.writeFileSync(path.join(carpetaN5, `${testInfo.repeatEachIndex}.txt`), precios.length + '\n');
  for (const precio of precios) {
    await expect(precio).toContainText(/\d/);
  }
});

test('N6 · va al carrito sin esperar a que se cree (A2)', async ({ page }) => {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9);
  await tarjetas(page).first().click();
  await expect(nombres(page)).toBeVisible();
  await page.locator('[data-test="add-to-cart"]').click();
  await page.goto('/checkout');
  await expect(page.locator('[data-test="cart-total"]')).toBeVisible();
});

// Control de N6 (no es una versión ingenua): idéntica, pero espera a que el contador
// del carrito suba a 1 antes de navegar. Si N6 falla por navegar sin esperar, esta
// debería pasar siempre; si también falla, la causa es otra (p. ej. que recargar la
// página con goto pierda el carrito aunque se espere).
test('N6c · control: espera al contador del carrito antes de ir a /checkout', async ({ page }) => {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9);
  await tarjetas(page).first().click();
  await expect(nombres(page)).toBeVisible();
  await page.locator('[data-test="add-to-cart"]').click();
  await expect(page.locator('[data-test="cart-quantity"]')).toHaveText('1');
  await page.goto('/checkout');
  await expect(page.locator('[data-test="cart-total"]')).toBeVisible();
});

// ---- Pedido completo: dos formas ingenuas de comprobar la confirmación ----
// Llegan al pago igual que la prueba buena (P7); solo cambia cómo se comprueba la
// confirmación tras pulsar `finish`. Cada ejecución crea un pedido local.
//
// Hipótesis (cualitativas):
//  N7 falla casi siempre o siempre: pregunta por la confirmación en el mismo instante
//     del clic, antes de que la petición de pago haya vuelto.
//  N8 pasa sin presión y falla con latencia alta (como N2): 500 ms fijos bastan solo
//     mientras la respuesta tarde menos que eso.

test('N7 · comprueba la confirmación justo al pulsar finish (A2)', async ({ page }) => {
  await hastaElPago(page);
  await page.locator('[data-test="finish"]').click();
  const visible = await page.locator('[data-test="payment-success-message"]').isVisible();
  expect(visible).toBe(true);
});

test('N8 · espera fija de 500 ms tras pulsar finish (A1)', async ({ page }) => {
  await hastaElPago(page);
  await page.locator('[data-test="finish"]').click();
  await page.waitForTimeout(500);
  const visible = await page.locator('[data-test="payment-success-message"]').isVisible();
  expect(visible).toBe(true);
});
