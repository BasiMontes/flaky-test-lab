# Detector de flakiness

Ejecuta una suite de Playwright muchas veces (`--repeat-each`), con presión opcional sobre el entorno, y clasifica cada prueba como **estable**, **flaky** o **rota**, con su tasa de fallo y un intervalo de confianza. Genera `informe.json` y `informe.md`, y sale con un código distinto de cero si encuentra lo que se le pide, para poder usarlo en CI.

No tiene dependencias: solo Node 20 o superior y el Playwright del proyecto.

## Uso

```bash
npm run detectar -- --config real-case/toolshop/playwright.config.ts --repeat 100
npm run detectar -- --config real-case/toolshop/playwright.config.ts --repeat 100 --cpu 4 --latencia 300
npm run detectar -- --analizar ruta/a/informe-playwright.json
```

| Opción | Qué hace |
|---|---|
| `--config` | Configuración de Playwright (por defecto `playwright.config.ts`) |
| `--repeat` | Repeticiones por prueba (por defecto 100) |
| `--grep` | Solo las pruebas cuyo título coincida |
| `--workers` | Workers de Playwright |
| `--cpu`, `--latencia` | Fijan `CPU_THROTTLE` y `LATENCIA_MS`. **La suite tiene que leer esas variables** (como hace `real-case/toolshop/tests/base.ts`); el detector solo las pasa |
| `--out` | Carpeta de salida (por defecto `informes/flaky-<fecha>/`, ignorada por git) |
| `--fail-on` | `flaky` (por defecto), `any` (flaky o rota) o `never` |
| `--analizar` | No ejecuta nada: analiza un informe JSON de Playwright que ya existe |

Código de salida: `0` todo bien, `1` se encontró lo pedido en `--fail-on`, `2` error de la herramienta (ruta mal, informe ilegible, argumento sin valor).

## Cómo clasifica

- **Estable:** ninguna ejecución falla.
- **Flaky:** falla algunas veces, o Playwright la marca como flaky por pasar tras un reintento.
- **Rota:** falla todas las veces. No es flakiness: es una prueba (o un producto) que no funciona.
- **Sin datos:** todas las ejecuciones se saltaron.

La tasa va acompañada de un **intervalo de Wilson al 95 %**, porque «0 fallos en 100 ejecuciones» no significa «0 % de fallo»: con 100 ejecuciones, el límite superior sigue siendo del 3,7 %. El informe lo dice en un aviso. Con menos de 30 repeticiones avisa de que la clasificación es poco fiable.

Los errores se agrupan por las primeras líneas de su mensaje (sin códigos de color), para ver de un vistazo si los fallos de una prueba tienen una sola causa o varias.

## Qué se ha comprobado y cómo

- **Formato:** se comprobó con una ejecución real de Playwright (`fixtures/ejemplo-real.json`). Con `--repeat-each`, cada repetición es una entrada separada de la misma prueba.
- **Analizador:** 7 pruebas con `npm run test:detector`. Las que dependen del formato usan ese informe real; las de la lógica de clasificación usan informes **inventados**, y los valores de referencia de Wilson (0/100 → 3,7 %; 50/100 → 40,4–59,6 %) son los conocidos.
- **De principio a fin:** ejecutado con Playwright real sobre pruebas de juguete sin navegador, donde la verdad se conoce por construcción (fallo cuando `repeatEachIndex % 4 === 0`): con 20 repeticiones, 5 fallos exactos. Códigos de salida comprobados en los cuatro casos.
- **Contra una suite con navegador:** ejecutado dos veces sobre las pruebas ingenuas N1 y N6c de `real-case/toolshop/` (100 repeticiones, 3/11/2026). N1 salió flaky con 81 y 75 fallos de 100, y N6c estable con 0 de 100 las dos veces; el código de salida fue 1. La diferencia entre las dos ejecuciones de N1 es compatible con el azar. Sin comprobar todavía: el uso con `--cpu` y `--latencia`, y el ejemplo de GitHub Actions.

## Limitaciones

- Solo ve **fallos**. No detecta pruebas que aprueban sin comprobar nada (como D1 o N5 del repo): para el detector son «estables».
- No detecta dependencias entre pruebas que `--repeat-each` no reproduce: con `--repeat-each`, dos repeticiones nunca comparten worker (ver B4).
- Una ejecución del detector es una sola medición: repetirla puede dar tasas distintas (ver B2, que dio 98 y 43).
- La presión (`--cpu`, `--latencia`) solo existe si la suite la implementa.

## Ejemplo de integración en CI (NO ejecutado)

Esquema de un flujo de GitHub Actions para la suite del catálogo, que solo usa páginas locales y no necesita ninguna aplicación externa. No se ha probado; puede requerir ajustes.

```yaml
name: detector-flaky
on: [pull_request]
jobs:
  detectar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run detectar -- --config playwright.config.ts --repeat 30 --fail-on flaky
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: informe-flaky, path: informes/ }
```

Con 30 repeticiones la detección es más débil que con 100: el intervalo es ancho. Es un compromiso entre tiempo de CI y fiabilidad.
