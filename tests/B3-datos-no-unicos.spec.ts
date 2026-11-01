import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { registrarUsuario, existeUsuario, borrarUsuario } from '../helpers/usuarios';

// Simula un flujo que tarda (decisión de diseño, como los 200 ms de B1).
// Ambas versiones lo tienen: la única diferencia es el nombre del usuario.
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// Versión inestable: todas las repeticiones usan el mismo nombre de usuario.
// Si otra prueba que corre a la vez ya lo registró, el registro falla
// ("ya existe"). Como el registro es exclusivo, solo ese síntoma es posible:
// quien tiene el usuario lo conserva hasta que él mismo lo borra.
test('B3 · usuario con nombre fijo (inestable)', async () => {
  const nombre = 'ana';
  registrarUsuario(nombre);
  await esperar(200);
  expect(existeUsuario(nombre)).toBe(true);
  borrarUsuario(nombre);
});

// Versión estable: cada prueba genera su propio nombre, único en toda la ejecución.
// Ninguna otra prueba puede coincidir con él, haya los workers que haya.
test('B3 · usuario con nombre único por prueba (estable)', async () => {
  const nombre = 'ana-' + crypto.randomUUID();
  registrarUsuario(nombre);
  await esperar(200);
  expect(existeUsuario(nombre)).toBe(true);
  borrarUsuario(nombre);
});
