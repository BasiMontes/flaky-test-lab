import fs from 'fs';
import path from 'path';

// Se ejecuta una vez antes de todas las pruebas.
// Borra los pedidos de B2 de ejecuciones anteriores: si quedara uno viejo en
// disco, la prueba que depende de otra pasaría sin que nadie lo hubiera
// creado en esta ejecución, y la medición no sería válida.
export default async function limpiarEstado(): Promise<void> {
  fs.rmSync(path.resolve(__dirname, '../estado/b2'), { recursive: true, force: true });
}
