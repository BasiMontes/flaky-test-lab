import { expect, Page } from './base';

// Lleva al navegador, ya con sesión iniciada y un producto en el carrito, hasta la
// pantalla de pago con "Cash on Delivery" elegido y `finish` habilitado. Cada paso
// espera a lo que necesita (aserciones con espera), sin pausas fijas. Lo comparten la
// prueba buena del pedido y las ingenuas, para que lo único distinto sea cómo se
// comprueba la confirmación al pulsar `finish`.
//
// Datos de dirección: el usuario de prueba trae calle y ciudad rellenas y faltan
// código postal, número y provincia; se rellena todo con datos de prueba (la dirección
// no se guarda en el perfil: se comprobó que la siguiente ejecución vuelve a traer la
// original).
export async function hastaElPago(page: Page) {
  await page.goto('/auth/login');
  await page.locator('[data-test="email"]').fill('customer@practicesoftwaretesting.com');
  await page.locator('[data-test="password"]').fill('welcome01');
  await page.locator('[data-test="login-submit"]').click();
  await expect(page).toHaveURL(/\/account/);

  await page.goto('/');
  const tarjetas = page.locator('[data-test^="product-01"]');
  await expect(tarjetas).toHaveCount(9);
  await tarjetas.first().click();
  await expect(page.locator('[data-test="product-name"]')).toBeVisible();

  await page.locator('[data-test="add-to-cart"]').click();
  await expect(page.locator('[data-test="cart-quantity"]')).toHaveText('1');
  await page.locator('[data-test="nav-cart"]').click();
  await expect(page.locator('[data-test="cart-total"]')).toBeVisible();

  await page.locator('[data-test="proceed-1"]').click();
  await page.locator('[data-test="proceed-2"]').click();

  await expect(page.locator('[data-test="country"]')).toBeVisible();
  await page.locator('[data-test="country"]').selectOption('ES');
  await page.locator('[data-test="postal_code"]').fill('41001');
  await page.locator('[data-test="house_number"]').fill('1');
  await page.locator('[data-test="street"]').fill('Calle de Prueba');
  await page.locator('[data-test="city"]').fill('Sevilla');
  await page.locator('[data-test="state"]').fill('Sevilla');
  await expect(page.locator('[data-test="proceed-3"]')).toBeEnabled();
  await page.locator('[data-test="proceed-3"]').click();

  await expect(page.locator('[data-test="payment-method"]')).toBeVisible();
  await page.locator('[data-test="payment-method"]').selectOption('cash-on-delivery');
  await expect(page.locator('[data-test="finish"]')).toBeEnabled();
}
