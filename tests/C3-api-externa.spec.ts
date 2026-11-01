import { test, expect } from '@playwright/test';
import path from 'path';
import { iniciarApi } from '../helpers/api-inestable';

const pagina = 'file://' + path.resolve(__dirname, '../pages/c3-api-externa.html');

// La página pide el saldo a una API al cargar, una sola vez y sin reintentos.
// Para esta causa, la "API externa" es un servidor local que responde 503 en el
// 20% de las peticiones (decisión de diseño: sustituye a un servicio irregular).

// Versión inestable: la prueba depende de la API en directo. Cuando la API
// responde 503, la página muestra el error y la prueba falla, aunque el código de
// la página no haya cambiado.
test('C3 · depende de la API en directo (inestable)', async ({ page }) => {
  const api = await iniciarApi(0.2);
  try {
    await page.goto(pagina + '?api=' + encodeURIComponent(api.url));
    await expect(page.locator('#saldo')).toHaveText('Saldo: 100 €');
  } finally {
    await api.cerrar();
  }
});

// Versión estable: la API se sustituye por una respuesta fija con page.route, así
// que la prueba comprueba la página y no el servicio. El caso "la API falla" se
// probaría aparte, con una respuesta 503 fijada a propósito (no hecho aquí).
test('C3 · API aislada con page.route (estable)', async ({ page }) => {
  await page.route('http://api.test/saldo', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ saldo: 100 }),
    }),
  );
  await page.goto(pagina + '?api=' + encodeURIComponent('http://api.test'));
  await expect(page.locator('#saldo')).toHaveText('Saldo: 100 €');
});
