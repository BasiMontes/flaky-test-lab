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
| A4 | Elemento que se mueve durante el clic | Pendiente | — |
| A5 | Re-render que invalida el locator | Pendiente | — |

### B. Estado y aislamiento
| ID | Causa | Estado | Tasa de fallo (medida) |
|----|-------|--------|------------------------|
| B1 | Estado compartido entre pruebas | Reproducida. Incluye una espera de 200 ms entre el incremento y la comprobación, como decisión de diseño para abrir la ventana | 47 de 100 ejecuciones fallan (medido 28/10/2026, macOS). En todos los fallos el valor leído es el esperado + 1. Versión estable: 0 de 100 |
| B5 | Escritura no atómica de un archivo compartido (lectura de contenido a medias) | Reproducida (1 fallo de 100 en la primera medición de B1, SyntaxError al leer JSON). Corregida con escritura atómica; en la medición posterior, 0 errores de lectura en 200 ejecuciones | 1 de 100 antes de la corrección; 0 de 200 después (una sola medición) |
| B2 | Dependencia del orden de ejecución | Pendiente | — |
| B3 | Datos no únicos en ejecución paralela | Pendiente | — |
| B4 | Cookies o localStorage persistentes | Pendiente | — |

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
