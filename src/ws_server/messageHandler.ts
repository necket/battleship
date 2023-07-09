import ws, { RawData } from 'ws';
import { parseMessage, stringlifyMessage } from './utils/utils';
import {
  AddPlayerToRoomData,
  AddShipsData,
  AttackData,
  CreateRoomData,
  MessageType,
  RandomAttackData,
  RegMessageData,
} from './types/messages';
import { userDB } from './db/users.db';
import { roomDB } from './db/rooms.db';
import { Player } from './game/Game';
import { Position } from './types/ship';
import { winnersDB } from './db/winners.db';

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
    case MessageType.Attack:
      return attackHandler(data, handlerParams);
    case MessageType.RandomAttack:
      return randomAttackHandler(data, handlerParams);
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

function regHandler(data: RegMessageData, { connectionId, type, client }: HandlerParams) {
  const res = userDB.createUser({ index: connectionId, ...data });
  client.send(stringlifyMessage({ type, data: res }));

  if (!res.error) {
    client.send(getUpdateRoomMessage());
  }
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
  const game = roomDB.getGameById(gameId);
  if (!game) return;

  game.addShips(indexPlayer, ships);
  const shouldStart = game.gameIsStarted();
  if (!shouldStart) return;

  const { currentPlayer } = game.getTurn();

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
    con.send(getTurnMessage(currentPlayer));
  });
}

function attackHandler({ gameId, indexPlayer, x, y }: AttackData, { connections }: HandlerParams) {
  const game = roomDB.getGameById(gameId);
  if (!game) return;

  const { currentPlayer } = game.getTurn();
  if (currentPlayer !== indexPlayer) return;

  const result = game.attack(indexPlayer, { x, y });
  if (!result) return;

  const { feedback, turn: nextTurn, shipKilledSideEffects, winPlayer } = result;

  game.players.forEach(({ indexPlayer }) => {
    const con = connections.get(indexPlayer);
    if (!con) return;

    con.send(
      stringlifyMessage({
        type: MessageType.Attack,
        data: feedback,
      })
    );

    if (shipKilledSideEffects) {
      shipKilledSideEffects.forEach((sideFeedback) => {
        con.send(
          stringlifyMessage({
            type: MessageType.Attack,
            data: sideFeedback,
          })
        );
      });
    }

    if (winPlayer) {
      con.send(
        stringlifyMessage({
          type: MessageType.Finish,
          data: { winPlayer },
        })
      );
    } else {
      con.send(getTurnMessage(nextTurn));
    }
  });

  if (winPlayer) {
    roomDB.removeRoom(gameId);
    const winners = winnersDB.updateWinners(winPlayer);

    if (winners) {
      connections.forEach((con) =>
        con.send(
          stringlifyMessage({
            type: MessageType.UpdateWinners,
            data: winners,
          })
        )
      );
    }
  }
}

function randomAttackHandler({ gameId, indexPlayer }: RandomAttackData, handlerParams: HandlerParams) {
  const game = roomDB.getGameById(gameId);
  if (!game) return;
  const targetPlayer = game.getTargetPlayer(indexPlayer);
  if (!targetPlayer) return;

  return attackHandler({ gameId, indexPlayer, ...generateUniqueRandomAttack(targetPlayer) }, handlerParams);
}

/* HELPERS */

function generateUniqueRandomAttack(targetPlayer: Player): ReturnType<typeof generateRandomAttack> {
  const randomAttack = generateRandomAttack();
  return targetPlayer.isNewShot(randomAttack) ? randomAttack : generateUniqueRandomAttack(targetPlayer);
}

function generateRandomAttack() {
  const x = Math.floor(Math.random() * 10);
  const y = Math.floor(Math.random() * 10);
  return { x, y };
}

function getTurnMessage(currentPlayer: number) {
  return stringlifyMessage({
    type: MessageType.Turn,
    data: { currentPlayer },
  });
}

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
