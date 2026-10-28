// Disposable backend fixture. Run with server's existing tsx and tsconfig.
import http from 'node:http';
import { DatabaseManager } from '../../server/src/database/DatabaseManager';
import { World } from '../../server/src/game/World';
import { ServerNetwork } from '../../server/src/network/ServerNetwork';

const db = new DatabaseManager(':memory:');
const world = new World(db);
const server = http.createServer((_request, response) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ testFixture: true, database: 'memory' }));
});
const network = new ServerNetwork(server, world);
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  network.close();
  server.close(() => { db.close(); process.exit(0); });
  setTimeout(() => { db.close(); process.exit(0); }, 1500).unref();
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
setTimeout(stop, 180000).unref();
server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  if (address && typeof address !== 'string') console.log('CODEX_FIXTURE_PORT=' + address.port);
});
