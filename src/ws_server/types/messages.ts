export enum MessageType {
  Reg = 'reg',
  CreateRoom = 'create_room',
  UpdateRoom = 'update_room',
  AddPlayerToRoom = 'add_player_to_room',
}

export interface RegMessageData {
  name: string;
  password: string;
}

export interface CreateRoomData {}

export interface AddPlayerToRoomData {
  indexRoom: number;
}
