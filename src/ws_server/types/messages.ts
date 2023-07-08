import { Ship } from './ship';

export enum MessageType {
  Reg = 'reg',
  CreateRoom = 'create_room',
  UpdateRoom = 'update_room',
  AddUserToRoom = 'add_user_to_room',
  CreateGame = 'create_game',
  AddShips = 'add_ships',
  StartGame = 'start_game',
}

export interface RegMessageData {
  name: string;
  password: string;
}

export interface CreateRoomData {}

export interface AddPlayerToRoomData {
  indexRoom: number;
}

export interface AddShipsData {
  gameId: number;
  ships: Ship[];
  indexPlayer: number;
}
