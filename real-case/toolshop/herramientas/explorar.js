// Herramienta de exploración (no es una prueba): lista los atributos data-test de
// varias pantallas de Toolshop para poder escribir selectores sin adivinar.
// Uso: node real-case/toolshop/herramientas/explorar.js
const { chromium } = require('@playwright/test');

const BASE = 'http://localhost:4200';

async function volcar(page, titulo) {
  await page.waitForLoadState('networkidle');
  const datos = await page.evaluate(() => {
    const m = {};
    document.querySelectorAll('[data-test]').forEach((e) => {
      const k = e.getAttribute('data-test');
      if (!k || /^(category|brand|product)-01/.test(k)) return;
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  });
  console.log(`\n=== ${titulo} (${page.url()}) ===`);
  console.log(Object.entries(datos).map(([k, n]) => (n > 1 ? `${k} x${n}` : k)).join('\n'));
}

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();

  await page.goto(BASE + '/auth/login');
  await volcar(page, 'LOGIN');

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('[data-test^="product-01"]').first().click();
  await volcar(page, 'DETALLE DE PRODUCTO');

  const anadir = page.locator('[data-test="add-to-cart"]');
  if (await anadir.count()) {
    await anadir.click();
    await page.waitForTimeout(1500);
    await volcar(page, 'DETALLE DE PRODUCTO TRAS AÑADIR');
    await page.goto(BASE + '/checkout');
    await volcar(page, 'CARRITO (/checkout)');
  } else {
    console.log('\n(No hay data-test="add-to-cart"; mira la lista de DETALLE DE PRODUCTO para el botón real.)');
  }

  await b.close();
})();
