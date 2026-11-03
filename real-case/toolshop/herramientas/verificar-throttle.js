// Comprueba que la ralentización de CPU se aplica de verdad: mide cuánto tarda el
// navegador en hacer el mismo cálculo con y sin ella. Si el ajuste funciona, con
// factor 4 debería tardar claramente más (del orden de 4 veces).
const { chromium } = require('@playwright/test');

async function medir(rate) {
  const b = await chromium.launch();
  const context = await b.newContext();
  const page = await context.newPage();
  if (rate > 1) {
    const sesion = await context.newCDPSession(page);
    await sesion.send('Emulation.setCPUThrottlingRate', { rate });
  }
  await page.goto('about:blank');
  const tiempos = [];
  for (let i = 0; i < 3; i++) {
    tiempos.push(
      await page.evaluate(() => {
        const t = performance.now();
        let x = 0;
        for (let i = 0; i < 50_000_000; i++) x += i % 7;
        return performance.now() - t;
      }),
    );
  }
  await b.close();
  return tiempos.map((t) => Math.round(t));
}

(async () => {
  const sin = await medir(1);
  const con = await medir(4);
  console.log('sin ralentizar (ms):', sin.join(', '));
  console.log('ralentizado x4 (ms):', con.join(', '));
  const media = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  console.log('cociente medio:', (media(con) / media(sin)).toFixed(1));
})();
