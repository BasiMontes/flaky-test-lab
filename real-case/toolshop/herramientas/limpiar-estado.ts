import fs from 'fs';
import path from 'path';

// Borra el estado que dejan las pruebas ingenuas (p. ej. el registro de N5) antes de
// cada ejecución, para que un resumen nunca mezcle datos de ejecuciones distintas.
export default async function limpiarEstado() {
  fs.rmSync(path.resolve(__dirname, '../estado'), { recursive: true, force: true });
}
