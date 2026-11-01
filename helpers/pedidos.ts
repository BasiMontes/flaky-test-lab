import fs from 'fs';
import path from 'path';

// Pedidos guardados en disco. Son los datos que una prueba deja para otra.
const carpeta = path.resolve(__dirname, '../estado/b2');

function rutaPedido(clave: string): string {
  return path.join(carpeta, clave + '.json');
}

export function crearPedido(clave: string): void {
  fs.mkdirSync(carpeta, { recursive: true });
  const ruta = rutaPedido(clave);
  // Escritura atómica (archivo temporal + renombrado), como en B5,
  // para que una lectura concurrente nunca vea un archivo a medias.
  const temporal = ruta + '.' + process.pid + '.tmp';
  fs.writeFileSync(temporal, JSON.stringify({ clave, estado: 'creado' }));
  fs.renameSync(temporal, ruta);
}

export function existePedido(clave: string): boolean {
  return fs.existsSync(rutaPedido(clave));
}

export function borrarPedido(clave: string): void {
  fs.rmSync(rutaPedido(clave), { force: true });
}
