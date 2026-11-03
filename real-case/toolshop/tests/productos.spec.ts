import { test, expect } from './base';

// Primera tanda, escrita como la escribiría un QA sin pensar en flakiness:
// aserciones con espera (web-first), sin esperas fijas y sin predicciones.
// Se mide con --repeat-each=100 y se anota lo que salga, falle o no.
//
// Selectores: solo `data-test` estables. Los de categoría y marca llevan ids
// generados (category-01M6...) y no se usan.
// Un producto = `data-test="product-<id>"`; los ids empiezan por "01".

const tarjetas = (page) => page.locator('[data-test^="product-01"]');
const nombres = (page) => page.locator('[data-test="product-name"]');

test('P1 · la portada muestra 9 productos con nombre y precio', async ({ page }) => {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9);
  await expect(nombres(page).first()).not.toBeEmpty();
  await expect(page.locator('[data-test="product-price"]').first()).toContainText(/\d/);
});

test('P2 · buscar "pliers" deja solo productos que lo contienen', async ({ page }) => {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9);
  await page.locator('[data-test="search-query"]').fill('pliers');
  await page.locator('[data-test="search-submit"]').click();
  await expect
    .poll(async () => {
      const textos = await nombres(page).allTextContents();
      return textos.length > 0 && textos.every((t) => /pliers/i.test(t));
    })
    .toBe(true);
});

test('P3 · la página siguiente cambia el primer producto', async ({ page }) => {
  await page.goto('/');
  await expect(tarjetas(page)).toHaveCount(9);
  const primero = (await nombres(page).first().textContent())?.trim() ?? '';
  expect(primero).not.toBe('');
  await page.locator('[data-test="pagination-next"]').click();
  await expect(nombres(page).first()).not.toHaveText(primero);
});
