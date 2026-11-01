import { test, expect } from '@playwright/test';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/c4-tamano-ventana.html');

// Tamaños de ventana de los "entornos" donde se ejecuta la prueba (portátil,
// monitor, ventana pequeña, móvil...). Se reparten por número de repetición, sin
// azar: con 100 repeticiones, cada tamaño se usa 20 veces. Es una decisión de
// diseño que simula la variedad de máquinas; no mide ningún entorno real.
// Por debajo de 768 px de ancho, la página colapsa el menú (2 de los 5 tamaños).
const tamanos = [
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 800, height: 600 },
  { width: 600, height: 800 },
  { width: 400, height: 800 },
];

// Versión inestable: da por hecho el diseño de escritorio y pulsa «Contacto»
// directamente. Si la ventana es estrecha, el enlace está oculto tras el menú y la
// prueba falla. El plazo de 2 s del clic es decisión de diseño, para que las
// pruebas que fallan no tarden los 30 s del plazo por defecto.
test('C4 · da por hecho el diseño de escritorio (inestable)', async ({ page }, testInfo) => {
  await page.setViewportSize(tamanos[testInfo.repeatEachIndex % tamanos.length]);
  await page.goto(pagina);
  await page.locator('#contacto').click({ timeout: 2000 });
  await expect(page.locator('#resultado')).toHaveText('Contacto abierto');
});

// Versión estable: comprueba qué diseño tiene delante y, si el menú está colapsado,
// lo abre antes de pulsar «Contacto». Funciona con cualquier tamaño. Otra opción
// habitual sería fijar el tamaño de ventana en la configuración y probar el diseño
// estrecho en pruebas propias.
test('C4 · se adapta al diseño (estable)', async ({ page }, testInfo) => {
  await page.setViewportSize(tamanos[testInfo.repeatEachIndex % tamanos.length]);
  await page.goto(pagina);
  if (await page.locator('#menu-boton').isVisible()) {
    await page.locator('#menu-boton').click();
  }
  await page.locator('#contacto').click({ timeout: 2000 });
  await expect(page.locator('#resultado')).toHaveText('Contacto abierto');
});
