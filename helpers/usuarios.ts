import fs from 'fs';
import path from 'path';

// Usuarios guardados en disco. El almacén exige nombres únicos, como una
// base de datos real con una restricción de unicidad.
const carpeta = path.resolve(__dirname, '../estado/b3');

function rutaUsuario(nombre: string): string {
  return path.join(carpeta, nombre + '.json');
}

export function registrarUsuario(nombre: string): void {
  fs.mkdirSync(carpeta, { recursive: true });
  try {
    // La opción 'wx' crea el archivo solo si no existe. Es la restricción de
    // unicidad y es atómica: dos pruebas no pueden registrar el mismo nombre.
    fs.writeFileSync(rutaUsuario(nombre), JSON.stringify({ nombre }), { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error('El usuario "' + nombre + '" ya existe');
    }
    throw error;
  }
}

export function existeUsuario(nombre: string): boolean {
  return fs.existsSync(rutaUsuario(nombre));
}

export function borrarUsuario(nombre: string): void {
  fs.rmSync(rutaUsuario(nombre), { force: true });
}
