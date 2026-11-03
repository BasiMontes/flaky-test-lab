'use strict';
// Reporter de Playwright mínimo para el detector: una sola línea de progreso, sin el detalle
// de cada fallo (ese detalle va al informe). Se usa junto al reporter json.

class Progreso {
  constructor() {
    this.total = 0;
    this.hechas = 0;
    this.fallos = 0;
    this.tty = Boolean(process.stdout.isTTY);
    this.ultimo = 0;
  }
  onBegin(_config, suite) {
    this.total = suite.allTests().length;
    console.log(`Ejecutando ${this.total} pruebas...`);
  }
  onTestEnd(_test, result) {
    this.hechas++;
    if (result.status !== 'passed' && result.status !== 'skipped') this.fallos++;
    const ahora = Date.now();
    // Sin terminal (CI, redirección a fichero) se imprime cada 10 % para no llenar el log.
    if (this.tty) {
      process.stdout.write(`\r  ${this.hechas}/${this.total} · con fallo: ${this.fallos}   `);
    } else if (this.hechas === this.total || ahora - this.ultimo > 5000) {
      this.ultimo = ahora;
      console.log(`  ${this.hechas}/${this.total} · con fallo: ${this.fallos}`);
    }
  }
  onEnd() {
    if (this.tty) process.stdout.write('\n');
  }
  printsToStdio() {
    return true;
  }
}

module.exports = Progreso;
