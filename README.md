# flaky-test-lab

Laboratorio de flaky tests. Cada causa de inestabilidad se reproduce con una página propia y controlada, una prueba mínima y una medición de su tasa de fallo con repeticiones.

## Criterio de entrada de una causa

- Produce fallos intermitentes medibles con `--repeat-each`.
- La causa se puede controlar en una página propia.

## Catálogo

Estado: **A1 en preparación**. Las tasas se rellenarán solo con mediciones reales.

### A. Tiempo y sincronización
| ID | Causa | Estado | Tasa de fallo (medida) |
|----|-------|--------|------------------------|
| A1 | Espera fija en lugar de espera por condición | Implementada, pendiente de medir | — |
| A2 | Carrera en la UI tras una petición | Pendiente | — |
| A3 | Timeout ajustado a la carga | Pendiente | — |
| A4 | Elemento que se mueve durante el clic | Pendiente | — |
| A5 | Re-render que invalida el locator | Pendiente | — |

### B. Estado y aislamiento
| ID | Causa | Estado | Tasa de fallo (medida) |
|----|-------|--------|------------------------|
| B1 | Estado compartido entre pruebas | Pendiente | — |
| B2 | Dependencia del orden de ejecución | Pendiente | — |
| B3 | Datos no únicos en ejecución paralela | Pendiente | — |
| B4 | Cookies o localStorage persistentes | Pendiente | — |

### C. Entorno y datos externos
| ID | Causa | Estado | Tasa de fallo (medida) |
|----|-------|--------|------------------------|
| C1 | Dependencia de la hora o la fecha | Pendiente | — |
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
