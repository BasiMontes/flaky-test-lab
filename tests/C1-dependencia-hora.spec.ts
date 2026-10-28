import { test, expect, Page } from '@playwright/test';
import path from 'path';

const pagina = 'file://' + path.resolve(__dirname, '../pages/c1-hora.html');
const dosDigitos = (n: number) => String(n).padStart(2, '0');
const horaMinuto = (d: Date) => dosDigitos(d.getHours()) + ':' + dosDigitos(d.getMinutes());
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// Ambas versiones tienen la misma espera de 2 s antes del clic.
// La única diferencia es si la hora es real (inestable) o fija (estable).

// Versión inestable: la prueba toma la hora real, espera 2 s y registra.
// Si el minuto cambia durante esa espera, la hora mostrada no coincide.
// Con una ventana de 2 s, el fallo esperado es de unas 2 de cada 60 ejecuciones.
test('C1 · hora real que cambia durante la prueba (inestable)', async ({ page }) => {
  await page.goto(pagina);
  const esperada = horaMinuto(new Date());
  await esperar(2000);
  await page.click('#registrar');
  await expect(page.locator('#resultado')).toHaveText('Registrado a las ' + esperada);
});

// Versión estable: el reloj del navegador queda fijado a una hora conocida.
// La hora esperada sale de esa misma fecha, así que no depende del momento de la ejecución.
test('C1 · hora fijada en el navegador (estable)', async ({ page }: { page: Page }) => {
  const fecha = new Date(2026, 9, 28, 10, 30, 0);
  await page.clock.setFixedTime(fecha);
  await page.goto(pagina);
  const esperada = horaMinuto(fecha);
  await esperar(2000);
  await page.click('#registrar');
  await expect(page.locator('#resultado')).toHaveText('Registrado a las ' + esperada);
});
