import { test, expect, TestInfo } from '@playwright/test';
import { crearPedido, existePedido, borrarPedido } from '../helpers/pedidos';

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// El pedido se identifica con el número de repetición (--repeat-each).
// Así cada repetición es independiente de las demás: sin esto, el pedido
// creado por una repetición haría pasar a la consulta de otra.
const clave = (prefijo: string, testInfo: TestInfo) =>
  prefijo + '-' + testInfo.repeatEachIndex;

// Paso 1 del flujo: crea el pedido. Tarda 300 ms (decisión de diseño que
// simula un flujo real, igual que la espera de 200 ms de B1).
test('B2 · crear pedido (lo necesita la prueba siguiente)', async ({}, testInfo) => {
  await esperar(300);
  crearPedido(clave('compartido', testInfo));
  expect(existePedido(clave('compartido', testInfo))).toBe(true);
});

// Versión inestable: da por hecho que la prueba anterior ya creó el pedido.
// Pasa si corre después de ella y falla si corre antes, a la vez o sola.
// La lectura es puntual (sin reintentos) para no ocultar el problema.
test('B2 · consultar pedido creado por otra prueba (inestable)', async ({}, testInfo) => {
  expect(existePedido(clave('compartido', testInfo))).toBe(true);
});

// Versión estable: la prueba prepara sus propios datos y los limpia al terminar.
// No depende de ninguna otra, así que el orden de ejecución no la afecta.
test('B2 · crear y consultar el pedido en la misma prueba (estable)', async ({}, testInfo) => {
  const propio = clave('propio', testInfo);
  await esperar(300);
  crearPedido(propio);
  expect(existePedido(propio)).toBe(true);
  borrarPedido(propio);
});
