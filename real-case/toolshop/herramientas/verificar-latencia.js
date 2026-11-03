// Comprueba que el retraso de LATENCIA_MS se aplica de verdad: mide cuánto tarda una
// petición GET a la API (sin comprobación previa CORS) con y sin retraso.
// Necesita Toolshop levantado. Uso: node real-case/toolshop/herramientas/verificar-latencia.js
const { chromium } = require('@playwright/test');

const LATENCIA = 300;

async function medir(conRetraso) {
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.goto('http://localhost:4200');
  if (conRetraso) {
    await page.route('http://localhost:8091/**', async (route) => {
      await new Promise((r) => setTimeout(r, LATENCIA));
      await route.continue();
    });
  }
  const tiempos = [];
  for (let i = 0; i < 5; i++) {
    tiempos.push(
      await page.evaluate(async () => {
        const t = performance.now();
        await fetch('http://localhost:8091/products?page=1');
        return performance.now() - t;
      }),
    );
  }
  await b.close();
  return tiempos.map((t) => Math.round(t));
}

(async () => {
  const sin = await medir(false);
  const con = await medir(true);
  console.log('sin retraso (ms):', sin.join(', '));
  console.log(`con retraso de ${LATENCIA} ms (ms):`, con.join(', '));
})();
