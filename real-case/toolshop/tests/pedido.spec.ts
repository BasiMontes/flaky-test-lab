import { test, expect } from './base';
import { hastaElPago } from './flujo';

// Tercera tanda: el pedido completo (inicio de sesión, producto, carrito, dirección,
// pago y confirmación). Misma regla que las anteriores: escrita como la escribiría un
// QA sin pensar en flakiness, sin pausas fijas y sin predicciones.
//
// Cada ejecución CREA UN PEDIDO en la base de datos local de Toolshop. Para dejarla
// limpia: docker exec -it pst-laravel-api-1 php artisan migrate:fresh --seed
//
// La confirmación se comprueba por su data-test (`payment-success-message`), no por
// el texto, que depende del idioma.

test('P7 · un pedido completo con pago contra reembolso se confirma', async ({ page }) => {
  await hastaElPago(page);
  await page.locator('[data-test="finish"]').click();
  await expect(page.locator('[data-test="payment-success-message"]')).toBeVisible();
});
