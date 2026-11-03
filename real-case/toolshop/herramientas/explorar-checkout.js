// Herramienta de exploración (no es una prueba): recorre el flujo de compra con el
// usuario de prueba y lista, en cada paso, los data-test visibles. Avisa de lo que
// hace; si algo no existe, lo dice y sigue.
// OJO: crea un pedido real en la base de datos LOCAL de Toolshop (no en la pública).
// Uso: node real-case/toolshop/herramientas/explorar-checkout.js
const { chromium } = require('@playwright/test');

const BASE = 'http://localhost:4200';

async function volcar(page, titulo) {
  await page.waitForLoadState('networkidle');
  // Pausa fija a propósito (es exploración, no una prueba).
  await page.waitForTimeout(2000);
  const datos = await page.evaluate(() => {
    const m = {};
    document.querySelectorAll('[data-test]').forEach((e) => {
      const k = e.getAttribute('data-test');
      if (!k || /^(category|brand|product|lang|nav)-/.test(k)) return;
      const visible = !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      const clave = visible ? k : `${k} (oculto)`;
      m[clave] = (m[clave] || 0) + 1;
    });
    return m;
  });
  console.log(`\n=== ${titulo} (${page.url()}) ===`);
  console.log(Object.entries(datos).map(([k, n]) => (n > 1 ? `${k} x${n}` : k)).join('\n'));
  const selects = await page.evaluate(() =>
    [...document.querySelectorAll('select[data-test]')].map((s) => ({
      test: s.getAttribute('data-test'),
      opciones: [...s.options].map((o) => `${o.value}=${o.textContent.trim()}`),
    })),
  );
  for (const s of selects) console.log(`  [select ${s.test}] ${s.opciones.join(' | ')}`);
}

async function pulsar(page, test) {
  const el = page.locator(`[data-test="${test}"]`);
  if (!(await el.count())) {
    console.log(`\n(No existe data-test="${test}"; se detiene aquí.)`);
    return false;
  }
  await el.first().click();
  console.log(`\n-> pulsado ${test}`);
  return true;
}

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();

  await page.goto(BASE + '/auth/login');
  await page.locator('[data-test="email"]').fill('customer@practicesoftwaretesting.com');
  await page.locator('[data-test="password"]').fill('welcome01');
  await page.locator('[data-test="login-submit"]').click();
  await volcar(page, 'TRAS INICIAR SESIÓN');

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('[data-test^="product-01"]').first().click();
  await page.waitForTimeout(2000);
  if (!(await pulsar(page, 'add-to-cart'))) return b.close();
  await page.waitForTimeout(1500);
  if (!(await pulsar(page, 'nav-cart'))) return b.close();
  await volcar(page, 'CARRITO (paso 1)');

  if (!(await pulsar(page, 'proceed-1'))) return b.close();
  await volcar(page, 'TRAS proceed-1');

  for (const paso of ['proceed-2', 'proceed-3']) {
    const el = page.locator(`[data-test="${paso}"]`);
    if (await el.count()) {
      await pulsar(page, paso);
      await volcar(page, `TRAS ${paso}`);
    }
  }

  const pago = page.locator('select[data-test="payment-method"]');
  if (await pago.count()) {
    const valores = await pago.evaluate((s) => [...s.options].map((o) => o.value).filter((v) => v));
    console.log('\nMétodos de pago disponibles:', valores.join(', '));
    for (const valor of valores.slice(0, 2)) {
      await pago.selectOption(valor);
      await volcar(page, `MÉTODO DE PAGO: ${valor}`);
    }
    await pago.selectOption(valores[0]);
    await page.waitForTimeout(500);
  }

  const fin = page.locator('[data-test="finish"]');
  if (await fin.count()) {
    console.log('\nfinish habilitado:', await fin.first().isEnabled());
    if (await fin.first().isEnabled()) {
      await pulsar(page, 'finish');
      await volcar(page, 'TRAS finish');
      const texto = await page.locator('body').innerText();
      console.log('\nTexto de la pantalla (primeros 500 caracteres):\n' + texto.slice(0, 500));
    }
  }

  await b.close();
})();
