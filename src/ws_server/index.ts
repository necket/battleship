import ws, { WebSocketServer } from 'ws';
import { parentHandler, closeHandler } from './messageHandler';

export const startWsServer = (port: number) => {
  const server = new WebSocketServer({ port });
  console.log(`Start web socket server on the ${port} port!`);
  server.on('connection', onConnection);
};

const connections: Map<number, ws> = new Map();
let nextConnectionId = 1;

const onConnection = (client: ws) => {
  const connectionId = nextConnectionId++;
  connections.set(connectionId, client);

  client.on('message', (message) => {
    parentHandler({
      message,
      connectionId,
      client,
      connections,
    });
  });

  client.on('close', closeHandler);
};
