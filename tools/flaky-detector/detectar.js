#!/usr/bin/env node
'use strict';
// Detector de flakiness: ejecuta una suite de Playwright N veces (--repeat-each),
// con presión opcional sobre el entorno, y clasifica cada prueba como estable, flaky
// o rota, con su tasa de fallo y un intervalo de confianza.
//
// Uso:
//   node tools/flaky-detector/detectar.js --config <playwright.config> [opciones]
//   node tools/flaky-detector/detectar.js --analizar <informe-playwright.json>
//
// Opciones:
//   --config <ruta>     Configuración de Playwright (por defecto playwright.config.ts)
//   --repeat <n>        Repeticiones por prueba (por defecto 100)
//   --grep <regex>      Solo las pruebas cuyo título coincida
//   --workers <n>       Workers de Playwright
//   --cpu <n>           CPU_THROTTLE: ralentiza la CPU del navegador (n veces); la suite
//                       debe leer esa variable (como real-case/toolshop/tests/base.ts)
//   --latencia <ms>     LATENCIA_MS: retraso por petición a la API; igual que arriba
//   --out <carpeta>     Dónde dejar informe.json e informe.md (por defecto informes/flaky-<fecha>)
//   --fail-on <flaky|any|never>  Cuándo salir con código 1 (por defecto flaky)
//                       flaky = hay alguna flaky; any = flaky o rota; never = nunca
// Código de salida: 0 todo bien, 1 se encontró lo pedido en --fail-on, 2 error de la herramienta.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { analizar, aTabla, aMarkdown } = require('./analizar.js');

function leerArgumentos(argv) {
  const a = { repeat: 100, 'fail-on': 'flaky', config: 'playwright.config.ts' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) throw new Error(`Argumento inesperado: ${k}`);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`Falta el valor de ${k}`);
    a[k.slice(2)] = v;
    i++;
  }
  return a;
}

function salir(codigo, mensaje) {
  if (mensaje) console.error(mensaje);
  process.exit(codigo);
}

(function main() {
  let a;
  try { a = leerArgumentos(process.argv.slice(2)); } catch (e) { return salir(2, `${e.message}\nVer la cabecera de ${path.relative(process.cwd(), __filename)}.`); }
  if (!['flaky', 'any', 'never'].includes(a['fail-on'])) return salir(2, '--fail-on debe ser flaky, any o never');

  const salida = path.resolve(a.out ?? path.join('informes', `flaky-${new Date().toISOString().replace(/[:.]/g, '-')}`));
  fs.mkdirSync(salida, { recursive: true });
  let jsonPath;
  const condiciones = {};

  if (a.analizar) {
    jsonPath = path.resolve(a.analizar);
    if (!fs.existsSync(jsonPath)) return salir(2, `No existe ${jsonPath}`);
    condiciones.origen = path.basename(jsonPath);
  } else {
    jsonPath = path.join(salida, 'playwright.json');
    const repeat = Number(a.repeat);
    if (!Number.isInteger(repeat) || repeat < 1) return salir(2, '--repeat debe ser un entero positivo');
    const args = ['playwright', 'test', '-c', a.config, '--repeat-each', String(repeat), '--reporter=line,json'];
    if (a.grep) args.push('-g', a.grep);
    if (a.workers) args.push('--workers', a.workers);
    const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonPath };
    if (a.cpu) env.CPU_THROTTLE = a.cpu;
    if (a.latencia) env.LATENCIA_MS = a.latencia;
    Object.assign(condiciones, { config: a.config, repeticiones: repeat, filtro: a.grep, workers: a.workers, 'cpu_x': a.cpu, 'latencia_ms': a.latencia });
    console.log(`Ejecutando: npx ${args.join(' ')}`);
    // Playwright sale con código distinto de 0 si algo falla: aquí no importa, se lee el informe.
    const r = spawnSync('npx', args, { env, stdio: 'inherit' });
    if (r.error) return salir(2, `No se pudo lanzar Playwright: ${r.error.message}`);
    if (!fs.existsSync(jsonPath)) return salir(2, `Playwright no generó el informe JSON (código ${r.status}). ¿Ruta de configuración correcta?`);
  }

  let informe;
  try { informe = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) { return salir(2, `Informe JSON ilegible: ${e.message}`); }
  const res = analizar(informe);
  if (res.pruebas.length === 0) return salir(2, 'El informe no contiene ninguna prueba.');

  const resultado = { fecha: new Date().toISOString(), condiciones, ...res };
  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify(resultado, null, 2));
  fs.writeFileSync(path.join(salida, 'informe.md'), aMarkdown(res, condiciones));

  console.log('\n' + aTabla(res));
  const s = res.resumen;
  console.log(`\nEstables: ${s.estables} · flaky: ${s.flaky} · rotas: ${s.rotas} · sin datos: ${s.sin_datos}`);
  console.log(`Informe en ${path.relative(process.cwd(), salida) || '.'}/ (informe.json, informe.md)`);

  const hayProblema = a['fail-on'] === 'any' ? s.flaky + s.rotas > 0 : a['fail-on'] === 'flaky' ? s.flaky > 0 : false;
  if (hayProblema) return salir(1);
})();
