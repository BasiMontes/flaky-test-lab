import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import fs from 'fs';
import { rutaContador, leerContador, incrementarContador } from '../helpers/contador';

// Simula un paso asíncrono que tarda (por ejemplo, un flujo de UI o una petición).
// Ambas versiones lo tienen, así que la única diferencia es el estado compartido.
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// Versión inestable: todas las pruebas usan el mismo contador.
// La prueba incrementa, espera un momento y comprueba el valor. Si otra
// prueba incrementa durante esa espera, el valor no es antes + 1 y falla
// aunque su código sea correcto.
test('B1 · contador compartido entre pruebas (inestable)', async () => {
  const ruta = rutaContador('compartido');
  const antes = leerContador(ruta);
  incrementarContador(ruta);
  await esperar(200);
  expect(leerContador(ruta)).toBe(antes + 1);
});

// Versión estable: cada prueba tiene su propio contador (nombre único).
// Nadie más lo modifica, así que la diferencia siempre es 1.
test('B1 · contador aislado por prueba (estable)', async () => {
  const ruta = rutaContador('aislado-' + crypto.randomUUID());
  const antes = leerContador(ruta);
  incrementarContador(ruta);
  await esperar(200);
  expect(leerContador(ruta)).toBe(antes + 1);
  fs.rmSync(ruta, { force: true });
});
