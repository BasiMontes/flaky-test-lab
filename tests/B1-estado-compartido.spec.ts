import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import fs from 'fs';
import { rutaContador, leerContador, incrementarContador } from '../helpers/contador';

// Versión inestable: todas las pruebas usan el mismo contador.
// Cada prueba mide el valor antes y después de su propio incremento.
// Si otra prueba incrementa entre ambas lecturas, la diferencia no es 1
// y la prueba falla aunque su código sea correcto.
test('B1 · contador compartido entre pruebas (inestable)', async () => {
  const ruta = rutaContador('compartido');
  const antes = leerContador(ruta);
  incrementarContador(ruta);
  expect(leerContador(ruta)).toBe(antes + 1);
});

// Versión estable: cada prueba tiene su propio contador (nombre único).
// Nadie más lo modifica, así que la diferencia siempre es 1.
test('B1 · contador aislado por prueba (estable)', async () => {
  const ruta = rutaContador('aislado-' + crypto.randomUUID());
  const antes = leerContador(ruta);
  incrementarContador(ruta);
  expect(leerContador(ruta)).toBe(antes + 1);
  fs.rmSync(ruta, { force: true });
});
