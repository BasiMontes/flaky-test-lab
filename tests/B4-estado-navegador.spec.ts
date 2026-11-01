import { test, expect, Browser, BrowserContext } from '@playwright/test';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/b4-carrito.html');

// Anti-patrón: un único contexto de navegador reutilizado por todas las pruebas
// de un mismo worker (se suele hacer para ahorrar tiempo de arranque).
// Cada worker es un proceso distinto, así que cada uno tiene su propio contexto,
// pero dentro de un worker el localStorage de una prueba llega a la siguiente.
let compartido: BrowserContext | undefined;
async function contextoCompartido(browser: Browser): Promise<BrowserContext> {
  if (!compartido) compartido = await browser.newContext();
  return compartido;
}

// Esta prueba es la que contamina: añade un artículo y lo deja guardado.
// Comprueba el valor relativo (antes + 1), así que pasa aunque el carrito
// ya tuviera artículos y no es la que falla por el estado heredado.
test('B4 · añadir un artículo al carrito (lo deja guardado)', async ({ browser }) => {
  const page = await (await contextoCompartido(browser)).newPage();
  try {
    await page.goto(pagina);
    const texto = (await page.locator('#estado').textContent()) ?? '';
    const antes = Number(texto.replace('Artículos: ', ''));
    await page.click('#anadir');
    await expect(page.locator('#estado')).toHaveText('Artículos: ' + (antes + 1));
  } finally {
    await page.close();
  }
});

// Versión inestable: espera un carrito vacío, pero usa el contexto compartido.
// Pasa si ninguna prueba anterior de su worker dejó artículos y falla si alguna sí.
test('B4 · carrito vacío al abrir, en el contexto compartido (inestable)', async ({ browser }) => {
  const page = await (await contextoCompartido(browser)).newPage();
  try {
    await page.goto(pagina);
    await expect(page.locator('#estado')).toHaveText('Artículos: 0');
  } finally {
    await page.close();
  }
});

// Versión estable: la misma comprobación con el contexto propio de la prueba
// (el que Playwright crea y descarta por cada una). No hereda nada de otras pruebas.
test('B4 · carrito vacío al abrir, en un contexto propio (estable)', async ({ page }) => {
  await page.goto(pagina);
  await expect(page.locator('#estado')).toHaveText('Artículos: 0');
});
