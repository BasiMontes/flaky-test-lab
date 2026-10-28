import fs from 'fs';
import path from 'path';

// Contadores guardados en disco. Son el estado que comparten las pruebas.
const carpeta = path.resolve(__dirname, '../estado');

export function rutaContador(nombre: string): string {
  fs.mkdirSync(carpeta, { recursive: true });
  return path.join(carpeta, nombre + '.json');
}

export function leerContador(ruta: string): number {
  if (!fs.existsSync(ruta)) return 0;
  return JSON.parse(fs.readFileSync(ruta, 'utf8')).valor;
}

export function incrementarContador(ruta: string): number {
  const nuevo = leerContador(ruta) + 1;
  // Escritura atómica: se escribe en un archivo temporal y se renombra.
  // Así otra worker nunca lee un archivo a medio escribir.
  const temporal = ruta + '.' + process.pid + '.' + Math.random().toString(36).slice(2) + '.tmp';
  fs.writeFileSync(temporal, JSON.stringify({ valor: nuevo }));
  fs.renameSync(temporal, ruta);
  return nuevo;
}
