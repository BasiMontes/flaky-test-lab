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
| A5 | Re-render que invalida el nodo guardado | Reproducida. Un `locator` se vuelve a resolver en cada acción, así que un repintado normal no lo rompe; lo que se rompe es un `ElementHandle` guardado antes (aquí, `page.$` y un paso intermedio de unos 150 ms). El momento del repintado (0 a 600 ms) y el paso intermedio son decisiones de diseño | 44 de 100 ejecuciones fallan (medido 1/11/2026, Chromium en macOS, una sola medición). Los 44 con «Element is not attached to the DOM» en `elementHandle.click`, como se esperaba. Versión estable: 0 de 100. La predicción (~25%, 150 ms sobre 600 ms) no se cumplió: 44 queda muy por encima del margen de 100 ejecuciones. Explicación probable, no medida: la ventana real es más larga que los 150 ms de las teclas, porque también cuentan el tiempo de la escritura y las comprobaciones previas del clic (3 de los 44 fallos ocurrieron ya dentro del clic, esperando a que el botón fuera estable). No se ha medido la duración real de esa ventana |

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
| C2 | Datos aleatorios sin semilla | Reproducida. La edad sale de `Math.random()` entre 0 y 99 y la app solo acepta mayores de edad; el error no indica qué edad salió (lo confirma la salida: «Edad no válida» sin el valor). La regla (18 o más) y el rango son decisiones de diseño. La versión estable usa un generador con semilla fija (mulberry32) y solo valores válidos: es reproducible, pero prueba siempre el mismo valor | 18 de 100 ejecuciones fallan (medido 1/11/2026, Chromium en macOS, una sola medición), todas con «Edad no válida: debe ser mayor de edad». Predicción: 18% (18 de 100 edades son menores); con 100 ejecuciones el margen es de unos 4 puntos. Versión estable: 0 de 100 |
| C3 | Red o API externa inestable | Reproducida. No se usa ninguna red externa: la «API» es un servidor local propio que responde 503 en el 20% de las peticiones, como sustituto controlado de un servicio irregular (la tasa del 20% es decisión de diseño). La versión estable aísla la API con `page.route` | 26 de 100 ejecuciones fallan (medido 1/11/2026, Chromium en macOS, una sola medición), todas con «Error al cargar el saldo». Predicción: ~20% (margen de unos 4 puntos); 26 queda a ~1,5 desviaciones típicas, compatible pero algo alto, y con una sola medición no se puede decir si es azar. La página muestra el mismo mensaje para un 503 que para un fallo de conexión, así que la salida no permite confirmar que los 26 fueron 503; el servidor aislado, probado sin navegador, dio 20,1% de 503 en 2000 peticiones. Versión estable: 0 de 100 |
| C4 | Resolución o tamaño de ventana | Reproducida. El tamaño no cambia entre ejecuciones de una misma máquina, sino entre máquinas; para medirlo con `--repeat-each` se simula esa variedad con 5 tamaños repartidos por número de repetición, sin azar (decisión de diseño, no mide ningún entorno real). Por debajo de 768 px la página colapsa el menú. La versión estable comprueba el diseño y abre el menú si hace falta | 40 de 100 ejecuciones fallan (medido 2/11/2026, Chromium en macOS), todas con «Timeout 2000ms exceeded… element is not visible» en el clic sobre `#contacto`. Es la cifra exacta prevista, y es así por construcción (2 de los 5 tamaños son estrechos), no es una tasa de ningún entorno real. Los 40 fallos son justo las repeticiones de índice 3 y 4 de cada grupo de 5 (los tamaños de 600 y 400 px de ancho), como se esperaba. Versión estable: 0 de 100 |

### D. Asertos débiles (aparte, no es flakiness estricta)
| ID | Causa | Estado |
|----|-------|--------|
| D1 | Aserto que puede pasar sin comprobar nada | Implementada, pendiente de medir. Es distinta del resto: la página tiene un fallo a propósito (los precios salen como «undefined €»), así que una prueba que comprueba de verdad DEBE fallar, y «aprobar» es el falso aprobado. El retraso de 0 a 600 ms de los productos y el plazo de 1 s de cada comprobación son decisiones de diseño. Cada prueba anota cuántos precios encontró (`npm run test:d1:resumen`) para contar cuántas veces recorrió una lista vacía |

## Cómo medir

```bash
npm install
npx playwright install chromium
npm run test:a1
```

`test:a1` ejecuta cada prueba 100 veces. La tasa de fallo se calcula a partir de ese resultado y se anota en la tabla solo cuando esté medida.
