import ws, { RawData } from 'ws';
import { parseMessage, stringlifyMessage } from './utils/utils';
import { AddPlayerToRoomData, CreateRoomData, MessageType, RegMessageData } from './types/messages';
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
    case MessageType.AddPlayerToRoom:
      return;
    default:
      return;
  }
};

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

// function addPlayerToRoomHandler({ roomIndex }: AddPlayerToRoomData, {}: HandlerParams) {
//   room
// }

function getUpdateRoomMessage() {
  const rooms = roomDB.getAllRooms();
  return stringlifyMessage({
    type: MessageType.UpdateRoom,
    data: rooms,
  });
}
