import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/d1-lista-precios.html');
const carpetaRegistro = path.resolve(__dirname, '../estado/d1');

// Anota cuántos precios encontró cada prueba antes de comprobarlos, para poder
// contar después cuántas veces la prueba recorrió una lista vacía.
function registrar(version: 'debil' | 'solida', repeticion: number, comprobados: number) {
  fs.mkdirSync(carpetaRegistro, { recursive: true });
  fs.writeFileSync(path.join(carpetaRegistro, `${version}-${repeticion}.txt`), comprobados + '\n');
}

// OJO: en D1 la página tiene un fallo a propósito (todos los precios salen como
// "undefined €"). Una prueba que de verdad comprueba los precios DEBE fallar.
// Aquí "fallar" es el resultado correcto y "aprobar" es el falso aprobado.
// Los 3 productos aparecen tras un retraso aleatorio de 0 a 600 ms. El plazo de 1 s
// de cada comprobación es decisión de diseño, para que las que fallan no tarden 5 s.

// Versión débil: recorre los precios que hay en el momento de preguntar. `.all()`
// no espera: si la lista aún está vacía, el bucle no se ejecuta ninguna vez y la
// prueba aprueba sin haber comprobado nada.
test('D1 · recorre los precios con .all(), sin esperar (débil)', async ({ page }, testInfo) => {
  await page.goto(pagina);
  const precios = await page.locator('.precio').all();
  registrar('debil', testInfo.repeatEachIndex, precios.length);
  for (const precio of precios) {
    await expect(precio).toHaveText(/^\d+ €$/, { timeout: 1000 });
  }
});

// Versión sólida: primero espera a que haya los 3 precios (si no aparecen, falla
// por eso) y después comprueba cada uno. Nunca recorre una lista vacía.
test('D1 · espera a que haya 3 precios y los comprueba (sólida)', async ({ page }, testInfo) => {
  await page.goto(pagina);
  await expect(page.locator('.precio')).toHaveCount(3);
  const precios = await page.locator('.precio').all();
  registrar('solida', testInfo.repeatEachIndex, precios.length);
  for (const precio of precios) {
    await expect(precio).toHaveText(/^\d+ €$/, { timeout: 1000 });
  }
});
