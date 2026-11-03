'use strict';
// Analiza un informe JSON de Playwright generado con --repeat-each y clasifica cada
// prueba por su tasa de fallo. Sin dependencias. Formato comprobado con una ejecución
// real de Playwright (fixtures/ejemplo-real.json): con --repeat-each, cada repetición
// aparece como una entrada separada de la misma prueba.

const ANSI = /\x1b\[[0-9;]*m/g;
const quitarColor = (s) => String(s ?? '').replace(ANSI, '');

// Intervalo de Wilson al 95 % para una proporción k/n. Sirve para no confundir
// "0 fallos en 100" con "0 % de fallo": el límite superior sigue siendo ~3,7 %.
function wilson(k, n, z = 1.96) {
  if (n === 0) return { bajo: 0, alto: 1 };
  const p = k / n;
  const z2 = z * z;
  const centro = (p + z2 / (2 * n)) / (1 + z2 / n);
  const margen = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return { bajo: Math.max(0, centro - margen), alto: Math.min(1, centro + margen) };
}

// Clave de agrupación de un error: las primeras líneas no vacías del mensaje, sin
// colores. Así "esperaba 9, recibió 0" y "timeout de 500 ms" no se mezclan.
function claveDeError(error) {
  const lineas = quitarColor(error?.message ?? error?.value ?? 'error sin mensaje')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return lineas.slice(0, 3).join(' | ').slice(0, 220);
}

function* recorrerSpecs(suite) {
  for (const spec of suite.specs ?? []) yield spec;
  for (const hija of suite.suites ?? []) yield* recorrerSpecs(hija);
}

const FALLO = new Set(['failed', 'timedOut', 'interrupted']);

function analizar(informe, { minimoRepeticiones = 30 } = {}) {
  const porPrueba = new Map();
  for (const suite of informe.suites ?? []) {
    for (const spec of recorrerSpecs(suite)) {
      const id = `${spec.file ?? ''}:${spec.line ?? ''} ${spec.title}`;
      if (!porPrueba.has(id)) {
        porPrueba.set(id, { id, titulo: spec.title, archivo: spec.file ?? '', linea: spec.line ?? null,
          pasan: 0, fallan: 0, tras_reintento: 0, saltadas: 0, errores: new Map() });
      }
      const p = porPrueba.get(id);
      for (const test of spec.tests ?? []) {
        const resultados = test.results ?? [];
        const ultimo = resultados[resultados.length - 1];
        if (test.status === 'skipped' || (resultados.length && resultados.every((r) => r.status === 'skipped'))) {
          p.saltadas += 1;
        } else if (test.status === 'flaky') {
          // Pasó, pero solo después de un reintento: Playwright lo marca flaky por sí mismo.
          p.tras_reintento += 1;
        } else if (test.status === 'unexpected' || (ultimo && FALLO.has(ultimo.status))) {
          p.fallan += 1;
          const e = [...resultados].reverse().find((r) => r.error)?.error;
          const clave = claveDeError(e);
          p.errores.set(clave, (p.errores.get(clave) ?? 0) + 1);
        } else {
          p.pasan += 1;
        }
      }
    }
  }

  const pruebas = [...porPrueba.values()].map((p) => {
    const ejecuciones = p.pasan + p.fallan + p.tras_reintento;
    const intervalo = wilson(p.fallan + p.tras_reintento, ejecuciones);
    let clase;
    if (ejecuciones === 0) clase = 'sin datos';
    else if (p.fallan === ejecuciones) clase = 'rota';
    else if (p.fallan > 0 || p.tras_reintento > 0) clase = 'flaky';
    else clase = 'estable';
    const avisos = [];
    if (ejecuciones > 0 && ejecuciones < minimoRepeticiones) avisos.push(`pocas repeticiones (${ejecuciones} < ${minimoRepeticiones}): la clasificación es poco fiable`);
    if (clase === 'estable' && ejecuciones > 0) avisos.push(`0 fallos no es 0 %: con ${ejecuciones} ejecuciones el límite superior al 95 % es ${(intervalo.alto * 100).toFixed(1)} %`);
    return {
      id: p.id, titulo: p.titulo, archivo: p.archivo, linea: p.linea, clase, ejecuciones,
      pasan: p.pasan, fallan: p.fallan, tras_reintento: p.tras_reintento, saltadas: p.saltadas,
      tasa_fallo: ejecuciones ? (p.fallan + p.tras_reintento) / ejecuciones : null,
      intervalo95: ejecuciones ? { bajo: intervalo.bajo, alto: intervalo.alto } : null,
      errores: [...p.errores.entries()].sort((a, b) => b[1] - a[1]).map(([mensaje, veces]) => ({ mensaje, veces })),
      avisos,
    };
  });

  const cuenta = (c) => pruebas.filter((p) => p.clase === c).length;
  return {
    resumen: { pruebas: pruebas.length, estables: cuenta('estable'), flaky: cuenta('flaky'), rotas: cuenta('rota'), sin_datos: cuenta('sin datos') },
    pruebas,
  };
}

const pct = (x) => (x === null ? '—' : `${(x * 100).toFixed(1)} %`);

function aTabla(res) {
  const filas = res.pruebas.map((p) => [p.clase.toUpperCase(), `${p.fallan + p.tras_reintento}/${p.ejecuciones}`, pct(p.tasa_fallo),
    p.intervalo95 ? `${pct(p.intervalo95.bajo)} – ${pct(p.intervalo95.alto)}` : '—', p.titulo]);
  const cab = ['CLASE', 'FALLOS', 'TASA', 'INTERVALO 95 %', 'PRUEBA'];
  const anchos = cab.map((c, i) => Math.max(c.length, ...filas.map((f) => f[i].length)));
  const linea = (f) => f.map((c, i) => c.padEnd(anchos[i])).join('  ');
  return [linea(cab), linea(anchos.map((a) => '-'.repeat(a))), ...filas.map(linea)].join('\n');
}

function aMarkdown(res, condiciones = {}) {
  const s = res.resumen;
  const out = ['# Informe del detector de flakiness', ''];
  const cond = Object.entries(condiciones).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (cond.length) out.push('Condiciones: ' + cond.map(([k, v]) => `${k} = ${v}`).join(', '), '');
  out.push(`Pruebas: ${s.pruebas} · estables: ${s.estables} · flaky: ${s.flaky} · rotas: ${s.rotas} · sin datos: ${s.sin_datos}`, '');
  out.push('| Clase | Fallos | Tasa | Intervalo 95 % | Prueba |', '|---|---|---|---|---|');
  for (const p of res.pruebas) {
    out.push(`| ${p.clase} | ${p.fallan + p.tras_reintento}/${p.ejecuciones} | ${pct(p.tasa_fallo)} | ${p.intervalo95 ? `${pct(p.intervalo95.bajo)} – ${pct(p.intervalo95.alto)}` : '—'} | ${p.titulo.replace(/\|/g, '\\|')} |`);
  }
  const conErrores = res.pruebas.filter((p) => p.errores.length);
  if (conErrores.length) {
    out.push('', '## Errores por prueba', '');
    for (const p of conErrores) {
      out.push(`### ${p.titulo}`, '');
      for (const e of p.errores) out.push(`- ${e.veces} × \`${e.mensaje.replace(/`/g, "'")}\``);
      out.push('');
    }
  }
  const avisos = res.pruebas.filter((p) => p.avisos.length);
  if (avisos.length) {
    out.push('## Avisos', '');
    for (const p of avisos) for (const a of p.avisos) out.push(`- ${p.titulo}: ${a}`);
    out.push('');
  }
  out.push('> Limitaciones: el detector solo ve fallos. No detecta pruebas que aprueban sin comprobar nada (como D1 o N5) ni dependencias entre pruebas que `--repeat-each` no reproduce (como B4).');
  return out.join('\n') + '\n';
}

module.exports = { analizar, wilson, claveDeError, aTabla, aMarkdown, quitarColor };
