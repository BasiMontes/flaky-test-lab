import { test, expect, Page } from './base';

// Segunda tanda: pruebas con estado (sesión y carrito). Misma regla que la primera:
// escritas como las escribiría un QA sin pensar en flakiness, sin esperas fijas y
// sin predicciones. Cada prueba parte de un contexto de navegador nuevo, así que no
// comparten sesión ni carrito.
//
// SUPOSICIONES SIN COMPROBAR hasta la primera ejecución: que tras iniciar sesión la
// URL pasa a /account, y que el importe de `unit-price` aparece tal cual dentro de
// `cart-total`. Si la primera ejecución las desmiente, se corrige la prueba (no la
// medición) y se anota.

const tarjetas = (page: Page) => page.locator('[data-test^="product-01"]');

async function abrirPrimerProducto(page: Page) {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9);
  await tarjetas(page).first().click();
  await expect(page.locator('[data-test="product-name"]')).toBeVisible();
}

test('P4 · iniciar sesión con el usuario de prueba lleva a la cuenta', async ({ page }) => {
  await page.goto('/auth/login');
  await page.locator('[data-test="email"]').fill('customer@practicesoftwaretesting.com');
  await page.locator('[data-test="password"]').fill('welcome01');
  await page.locator('[data-test="login-submit"]').click();
  await expect(page).toHaveURL(/\/account/);
});

test('P5 · añadir un producto actualiza el contador del carrito a 1', async ({ page }) => {
  await abrirPrimerProducto(page);
  await page.locator('[data-test="add-to-cart"]').click();
  await expect(page.locator('[data-test="cart-quantity"]')).toHaveText('1');
});

test('P6 · el carrito muestra el producto y su importe en el total', async ({ page }) => {
  await abrirPrimerProducto(page);
  const nombre = ((await page.locator('[data-test="product-name"]').textContent()) ?? '').trim();
  const importe = ((await page.locator('[data-test="unit-price"]').textContent()) ?? '').match(/\d+\.\d{2}/)?.[0];
  expect(nombre).not.toBe('');
  expect(importe, 'no se pudo leer el importe de unit-price').toBeDefined();

  await page.locator('[data-test="add-to-cart"]').click();
  await expect(page.locator('[data-test="cart-quantity"]')).toHaveText('1');
  await page.locator('[data-test="nav-cart"]').click();

  await expect(page.locator('[data-test="product-title"]')).toContainText(nombre);
  await expect(page.locator('[data-test="cart-total"]')).toContainText(importe!);
});
