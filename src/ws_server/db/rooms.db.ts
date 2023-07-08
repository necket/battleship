import { Room } from '../types/rooms';
import { User } from '../types/users';

let nextRoomId = 1;

class RoomDB {
  private rooms: Room[];

  constructor() {
    this.rooms = [];
  }

  public getAllRooms = () => {
    return this.rooms;
  };

  public createRoom = (user: User) => {
    const roomId = nextRoomId++;
    const newRoom = {
      roomId,
      roomUsers: [user],
    };
    this.rooms = [...this.rooms, newRoom];

    return this.rooms;
  };
}

export const roomDB = new RoomDB();
