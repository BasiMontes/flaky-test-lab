import http from 'http';
import type { AddressInfo } from 'net';

// API local que sustituye a un servicio externo irregular: responde 503 con la
// probabilidad indicada y 200 con { saldo: 100 } el resto de las veces.
// Escucha en un puerto libre elegido por el sistema, para que varios workers
// puedan tener cada uno la suya sin chocar.
export async function iniciarApi(tasaFallo: number) {
  const servidor = http.createServer((_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (Math.random() < tasaFallo) {
      res.statusCode = 503;
      res.end('Servicio no disponible');
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ saldo: 100 }));
  });
  await new Promise<void>((resolver) => servidor.listen(0, '127.0.0.1', resolver));
  const { port } = servidor.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    cerrar: () =>
      new Promise<void>((resolver) => {
        servidor.close(() => resolver());
        servidor.closeAllConnections();
      }),
  };
}
