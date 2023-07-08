import ws, { RawData } from 'ws';
import { parseMessage, stringlifyMessage } from './utils/utils';
import { AddPlayerToRoomData, AddShipsData, CreateRoomData, MessageType, RegMessageData } from './types/messages';
import { userDB } from './db/users.db';
import { roomDB } from './db/rooms.db';

interface ParentHandlerParams {
  connectionId: number;
  message: RawData;
  client: ws;
  connections: Map<number, ws>;
}

type HandlerParams = Pick<ParentHandlerParams, 'connectionId' | 'connections' | 'client'> & { type: MessageType };

export const parentHandler = (params: ParentHandlerParams) => {
  const { connectionId, message: rawMessage, client, connections } = params;
  const { data, type } = parseMessage(rawMessage);

  const handlerParams: HandlerParams = { connectionId, connections, client, type };

  switch (type) {
    case MessageType.Reg:
      return regHandler(data, handlerParams);
    case MessageType.CreateRoom:
      return createRoomHandler(data, handlerParams);
    case MessageType.AddUserToRoom:
      return addPlayerToRoomHandler(data, handlerParams);
    case MessageType.AddShips:
      return addShipsHandler(data, handlerParams);
    default:
      return;
  }
};

/* HANDLERS */

export const closeHandler = (connectionId: number) => {
  const user = userDB.getUser(connectionId);
  if (!user) return;
  userDB.deleteUser(connectionId);
};

function regHandler({ name }: RegMessageData, { connectionId, type, client }: HandlerParams) {
  const user = userDB.createUser({ index: connectionId, name });
  const res = stringlifyMessage({ type, data: user });
  client.send(res);
  client.send(getUpdateRoomMessage());
}

function createRoomHandler(_: CreateRoomData, { connectionId, client, connections }: HandlerParams) {
  const user = userDB.getUser(connectionId);
  if (!user) return;

  roomDB.createRoom(user);
  connections.forEach((con) => con.send(getUpdateRoomMessage()));
}

function addPlayerToRoomHandler(
  { indexRoom }: AddPlayerToRoomData,
  { connectionId, connections, client }: HandlerParams
) {
  const user = userDB.getUser(connectionId);
  const room = roomDB.getRoomById(indexRoom);
  const existingPlayerid = room?.roomUsers[0].index;

  if (!user || !indexRoom || !existingPlayerid || existingPlayerid === connectionId) return;

  const existingPlayerClient = connections.get(existingPlayerid);
  if (!existingPlayerClient) return;

  const res = roomDB.addPlayer(indexRoom, user);
  if (!res?.game) return;

  const gameId = res.game.gameId;
  client.send(getStartGameMessage(gameId, user.index));
  existingPlayerClient.send(getStartGameMessage(gameId, existingPlayerid));

  connections.forEach((con) => con.send(getUpdateRoomMessage()));
}

function addShipsHandler({ indexPlayer, ships, gameId }: AddShipsData, { connections }: HandlerParams) {
  const game = roomDB.addShips(gameId, indexPlayer, ships);
  if (!game) return;
  const shouldStart = game.gameIsStarted();
  if (!shouldStart) return;

  game.players.forEach(({ indexPlayer }) => {
    const con = connections.get(indexPlayer);
    if (!con) return;

    const startGame = game.startGame(indexPlayer);
    con.send(
      stringlifyMessage({
        type: MessageType.StartGame,
        data: startGame,
      })
    );
  });
}

/* HELPERS */

function getUpdateRoomMessage() {
  const rooms = roomDB.getAllRooms();
  return stringlifyMessage({
    type: MessageType.UpdateRoom,
    data: rooms,
  });
}

function getStartGameMessage(idGame: number, idPlayer: number) {
  return stringlifyMessage({
    type: MessageType.CreateGame,
    data: { idGame, idPlayer },
  });
}
