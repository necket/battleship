import { Game } from '../game/Game';
import { Room } from '../types/rooms';
import { Ship } from '../types/ship';
import { User } from '../types/users';
import { userDB } from './users.db';

let nextRoomId = 1;

class RoomDB {
  private rooms: Room[];

  constructor() {
    this.rooms = [];
  }

  private updateRoom = (updatedRoom: Room) => {
    this.rooms = this.rooms.map((room) => (room.roomId === updatedRoom.roomId ? updatedRoom : room));
    return updatedRoom;
  };

  public getAllRooms = () => {
    return this.rooms.filter((room) => room.game === null);
  };

  public getRoomById = (roomId: number) => {
    return this.rooms.find((room) => room.roomId === roomId);
  };

  public getGameById = (roomId: number) => {
    return this.rooms.find((room) => room.roomId === roomId)?.game;
  };

  public createRoom = (user: User) => {
    const roomId = nextRoomId++;
    const newRoom = {
      roomId,
      roomUsers: [user],
      game: null,
    };
    this.rooms = [...this.rooms, newRoom];

    return this.rooms;
  };

  public addPlayer = (roomId: number, user: User) => {
    const roomToUpdate = this.getRoomById(roomId);
    if (!roomToUpdate) return null;
    const roomUsers = [...roomToUpdate.roomUsers, user];
    const updatedRoom = {
      ...roomToUpdate,
      roomUsers,
      game: new Game({ gameId: roomId, roomUsers }),
    };
    return this.updateRoom(updatedRoom);
  };

  public addShips = (gameId: number, indexPlayer: number, ships: Ship[]) => {
    const room = this.getRoomById(gameId);
    if (!room || !room.game) return;
    room.game.addShips(indexPlayer, ships);
    return room.game;
  };
}

export const roomDB = new RoomDB();
