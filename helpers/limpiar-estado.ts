import fs from 'fs';
import path from 'path';

// Se ejecuta una vez antes de todas las pruebas.
// Borra los datos de B2 y B3 de ejecuciones anteriores. Si quedara algo en
// disco (por ejemplo, tras cortar una ejecución con Ctrl-C), una prueba podría
// pasar sin que nadie lo hubiera creado, o fallar por un usuario viejo, y la
// medición no sería válida.
export default async function limpiarEstado(): Promise<void> {
  for (const carpeta of ['b2', 'b3']) {
    fs.rmSync(path.resolve(__dirname, '../estado/' + carpeta), { recursive: true, force: true });
  }
}
