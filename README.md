# flaky-test-lab

Laboratorio de flaky tests. Cada causa de inestabilidad se reproduce con una página propia y controlada, una prueba mínima y una medición de su tasa de fallo con repeticiones.

## Criterio de entrada de una causa

- Produce fallos intermitentes medibles con `--repeat-each`.
- La causa se puede controlar en una página propia.

## Catálogo

Estado: **A1 reproducida**. Las tasas se anotan solo con mediciones reales.

### A. Tiempo y sincronización
| ID | Causa | Estado | Tasa de fallo (medida) |
|----|-------|--------|------------------------|
| A1 | Espera fija en lugar de espera por condición | Reproducida | 59 de 100 ejecuciones fallan (medido 28/10/2026, Chromium en macOS). Versión estable: 0 de 100 |
| A2 | Carrera en la UI tras una petición | Reproducida | 93 de 100 ejecuciones fallan (medido 28/10/2026, Chromium en macOS). Versión estable: 0 de 100 |
| A3 | Timeout ajustado a la carga | Reproducida | 32 de 100 ejecuciones fallan (medido 28/10/2026, Chromium en macOS). Versión estable: 0 de 100 |
| A4 | Elemento que se mueve durante el clic | Reproducida. El clic normal de Playwright espera a que el elemento esté estable y no tapado, así que esta causa solo aparece al hacer clic en coordenadas leídas antes (aquí, `mouse.click` con la caja leída antes de un paso intermedio de unos 150 ms). El retraso del aviso (0 a 600 ms) y el paso intermedio son decisiones de diseño | 26 de 100 ejecuciones fallan (medido 1/11/2026, Chromium en macOS, una sola medición). Todos los fallos terminan con `#resultado` vacío: el botón no recibió el clic. Que el clic cayera en otro sitio por el desplazamiento es la explicación coherente con el diseño, pero no se ha comprobado directamente (no se registró dónde cayó). Predicción previa: en torno a 1 de 4 (150 ms sobre 600 ms); salió 26. Versión estable: 0 de 100 |
| A5 | Re-render que invalida el locator | Pendiente | — |

### B. Estado y aislamiento
| ID | Causa | Estado | Tasa de fallo (medida) |
|----|-------|--------|------------------------|
| B1 | Estado compartido entre pruebas | Reproducida. Incluye una espera de 200 ms entre el incremento y la comprobación, como decisión de diseño para abrir la ventana | 47 de 100 ejecuciones fallan (medido 28/10/2026, macOS). En todos los fallos el valor leído es el esperado + 1. Versión estable: 0 de 100 |
| B5 | Escritura no atómica de un archivo compartido (lectura de contenido a medias) | Reproducida (1 fallo de 100 en la primera medición de B1, SyntaxError al leer JSON). Corregida con escritura atómica; en la medición posterior, 0 errores de lectura en 200 ejecuciones | 1 de 100 antes de la corrección; 0 de 200 después (una sola medición) |
| B2 | Dependencia del orden de ejecución | Reproducida. El paso de 300 ms de la prueba que crea el pedido es decisión de diseño. Con la consulta sola falla siempre por construcción (nadie crea el pedido), así que ese escenario demuestra la dependencia pero no es intermitencia | En paralelo (4 workers): 98 de 100 consultas fallan (medido 1/11/2026, macOS). La tasa depende de cómo reparta Playwright las pruebas entre workers: una ejecución anterior, que incluyó por error otras pruebas en la misma corrida, dio 43 de 100. Consulta sola: 100 de 100 fallan. Un worker y en orden: 0 de 100 (300 de 300 pasan). Versión estable: 0 de 100 en paralelo y en serie |
| B3 | Datos no únicos en ejecución paralela | Reproducida. La espera de 200 ms es decisión de diseño. Como el registro es exclusivo, solo es posible un síntoma: el registro duplicado | En paralelo (4 workers): 34 de 100 fallan (medido 1/11/2026, macOS, una sola medición), todos con «El usuario "ana" ya existe». Un solo worker: 0 de 100 (200 de 200 pasan). Versión estable: 0 de 100 en paralelo y en serie |
| B4 | Cookies o localStorage persistentes | Reproducida con un solo worker; no reproducida con 4 workers y `--repeat-each`. Se reproduce con localStorage; no se ha probado con cookies (no funcionan en `file://`) | Un solo worker: 100 de 100 comprobaciones fallan, todas con «Artículos: 1», el artículo que dejó la prueba que añade (medido 1/11/2026, macOS, Playwright 1.64.1). En paralelo (4 workers): 0 de 100. La comprobación sola: 0 de 100 (control). Versión estable: 0 de 100 en paralelo y en serie. Explicación: Playwright no comparte workers entre repeticiones (el identificador del worker incluye `repeatEachIndex`), así que con 4 workers la escritura y la comprobación de una repetición corren a la vez en workers distintos y no se contaminan; con 1 worker corren seguidas en el mismo. La parte de la concurrencia es una inferencia coherente con el código y el resultado, no observada directamente. El 0 en paralelo es propio de `--repeat-each`: en una suite sin repeticiones, pruebas del mismo archivo sí pueden compartir worker (no medido) |

### C. Entorno y datos externos
| ID | Causa | Estado | Tasa de fallo (medida) |
|----|-------|--------|------------------------|
| C1 | Dependencia de la hora o la fecha | Reproducida. Ventana de 2 s en ambas versiones; el fallo depende de que cambie el minuto en esa ventana | 3 de 100 ejecuciones fallan (medido 28/10/2026, macOS), en todos los casos el minuto siguiente. Versión estable: 0 de 100 |
| C2 | Datos aleatorios sin semilla | Pendiente | — |
| C3 | Red o API externa inestable | Pendiente | — |
| C4 | Resolución o tamaño de ventana | Pendiente | — |

### D. Asertos débiles (aparte, no es flakiness estricta)
| ID | Causa | Estado |
|----|-------|--------|
| D1 | Aserto que puede pasar sin comprobar nada | Pendiente |

## Cómo medir

```bash
npm install
npx playwright install chromium
npm run test:a1
```

`test:a1` ejecuta cada prueba 100 veces. La tasa de fallo se calcula a partir de ese resultado y se anota en la tabla solo cuando esté medida.
