'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { analizar, wilson, claveDeError, aTabla, aMarkdown } = require('./analizar.js');

// 1) Informe REAL de Playwright (fixtures/ejemplo-real.json): 8 repeticiones de cuatro
//    pruebas de juguete sin navegador. La verdad esperada se conoce por construcción:
//    "flaky de juguete" falla cuando repeatEachIndex % 4 === 0, es decir 2 de 8.
test('clasifica un informe real de Playwright con --repeat-each', () => {
  const res = analizar(require('./fixtures/ejemplo-real.json'));
  const por = Object.fromEntries(res.pruebas.map((p) => [p.titulo, p]));
  assert.strictEqual(por['flaky de juguete'].clase, 'flaky');
  assert.strictEqual(por['flaky de juguete'].fallan, 2);
  assert.strictEqual(por['flaky de juguete'].ejecuciones, 8);
  assert.strictEqual(por['siempre pasa'].clase, 'estable');
  assert.strictEqual(por['siempre pasa'].pasan, 8);
  assert.strictEqual(por['siempre falla'].clase, 'rota');
  assert.strictEqual(por['saltada'].clase, 'sin datos');
  assert.strictEqual(por['saltada'].saltadas, 8);
  assert.deepStrictEqual(res.resumen, { pruebas: 4, estables: 1, flaky: 1, rotas: 1, sin_datos: 1 });
});

test('agrupa los errores sin códigos de color', () => {
  const res = analizar(require('./fixtures/ejemplo-real.json'));
  const rota = res.pruebas.find((p) => p.titulo === 'siempre falla');
  assert.strictEqual(rota.errores.length, 1);
  assert.strictEqual(rota.errores[0].veces, 8);
  assert.ok(!rota.errores[0].mensaje.includes('\x1b'));
});

// 2) Informes INVENTADOS, solo para comprobar la lógica de la clasificación.
const entrada = (status, error) => ({ status, results: [{ status: status === 'expected' ? 'passed' : 'failed', error }] });
const informe = (tests) => ({ suites: [{ specs: [{ title: 'p', file: 'a.spec.ts', line: 1, tests }] }] });

test('una prueba que pasa tras reintento cuenta como flaky', () => {
  const res = analizar(informe([{ status: 'flaky', results: [{ status: 'failed' }, { status: 'passed' }] }, entrada('expected')]));
  assert.strictEqual(res.pruebas[0].clase, 'flaky');
  assert.strictEqual(res.pruebas[0].tras_reintento, 1);
});

test('distingue errores distintos de la misma prueba', () => {
  const res = analizar(informe([entrada('unexpected', { message: 'Expected: 9\nReceived: 0' }), entrada('unexpected', { message: 'Timeout 500ms' }), entrada('expected')]));
  assert.strictEqual(res.pruebas[0].errores.length, 2);
});

test('avisa de pocas repeticiones y de que 0 fallos no es 0 %', () => {
  const res = analizar(informe(Array.from({ length: 10 }, () => entrada('expected'))));
  assert.ok(res.pruebas[0].avisos.some((a) => a.includes('pocas repeticiones')));
  assert.ok(res.pruebas[0].avisos.some((a) => a.includes('0 fallos no es 0 %')));
});

test('el intervalo de Wilson es el esperado', () => {
  // Valores de referencia conocidos: 0/100 -> alto ≈ 3,70 %; 50/100 -> ≈ (40,4 %, 59,6 %).
  assert.ok(Math.abs(wilson(0, 100).alto - 0.037) < 0.001);
  const m = wilson(50, 100);
  assert.ok(Math.abs(m.bajo - 0.404) < 0.002 && Math.abs(m.alto - 0.596) < 0.002);
  assert.deepStrictEqual(wilson(0, 0), { bajo: 0, alto: 1 });
});

test('las salidas de texto se generan', () => {
  const res = analizar(require('./fixtures/ejemplo-real.json'));
  assert.ok(aTabla(res).includes('FLAKY'));
  assert.ok(aMarkdown(res, { cpu: 4 }).includes('Limitaciones'));
  assert.ok(claveDeError({ message: '\x1b[31mHola\x1b[39m\n\nmundo' }) === 'Hola | mundo');
});
